# Loathr — Video transcode → R2
# =============================================================================
# Paste these cells into a Google Colab notebook (same account as your Drive).
# It pulls video masters from a Drive folder, transcodes each to a web-friendly
# MP4 (H.264, faststart) + an optional short muted preview loop for the gallery,
# uploads both to Cloudflare R2, and prints the public URLs to paste into each
# project's `videoUrl` field in /cms.
#
# Mirrors your image pipeline: Drive API by folder id + boto3 to R2.
# =============================================================================

# %% [1] CONFIG — fill these in ------------------------------------------------
# Drive folder that holds the video masters (the id from the folder's URL:
#   https://drive.google.com/drive/folders/THIS_PART )
DRIVE_VIDEO_FOLDER_ID = "PASTE_FOLDER_ID"
RECURSE_SUBFOLDERS    = True          # also scan subfolders

# Cloudflare R2 (same bucket as the images). Secrets: paste when prompted below,
# or hard-code here if you prefer (don't commit them anywhere).
R2_ACCOUNT_ID   = "PASTE_ACCOUNT_ID"
R2_BUCKET       = "PASTE_BUCKET_NAME"
R2_PUBLIC_BASE  = "https://pub-ea1f271a548f41ada37411b1a646b020.r2.dev"  # your public r2.dev base
R2_PREFIX       = "video"             # keys go under video/...

# Transcode settings
MASTER_MAX_H = 1080                   # cap the web master's height (1080p)
MASTER_CRF   = 23                     # quality (lower = better/larger; 20–24 typical)
MASTER_MAXRATE = "6M"                 # bitrate ceiling
MAKE_PREVIEW = True                   # also make a short muted loop for the gallery
PREVIEW_H    = 720                    # preview height
PREVIEW_SECS = 12                     # preview length (from start)
OVERWRITE    = False                  # re-upload even if the key already exists

# %% [2] SETUP -----------------------------------------------------------------
import os, re, io, json, subprocess, getpass
!apt-get -qq install -y ffmpeg >/dev/null
!pip -q install boto3 google-api-python-client >/dev/null

from google.colab import auth
auth.authenticate_user()
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
drive = build("drive", "v3")

import boto3
from botocore.config import Config
if "PASTE" in R2_ACCOUNT_ID:  R2_ACCOUNT_ID = getpass.getpass("R2 Account ID: ")
if "PASTE" in R2_BUCKET:      R2_BUCKET     = input("R2 bucket name: ")
R2_KEY    = getpass.getpass("R2 Access Key ID: ")
R2_SECRET = getpass.getpass("R2 Secret Access Key: ")
s3 = boto3.client(
    "s3",
    endpoint_url=f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
    aws_access_key_id=R2_KEY, aws_secret_access_key=R2_SECRET,
    region_name="auto", config=Config(signature_version="s3v4"),
)
print("Setup OK · ffmpeg", subprocess.run(["ffmpeg","-version"],capture_output=True,text=True).stdout.split()[2])

# %% [3] FIND THE VIDEO MASTERS ------------------------------------------------
def list_videos(folder_id):
    out, stack = [], [folder_id]
    while stack:
        fid = stack.pop()
        tok = None
        while True:
            r = drive.files().list(
                q=f"'{fid}' in parents and trashed=false",
                fields="nextPageToken, files(id,name,mimeType,size)",
                pageToken=tok, pageSize=200,
                includeItemsFromAllDrives=True, supportsAllDrives=True,
            ).execute()
            for f in r.get("files", []):
                if f["mimeType"] == "application/vnd.google-apps.folder":
                    if RECURSE_SUBFOLDERS: stack.append(f["id"])
                elif f["mimeType"].startswith("video/") or f["name"].lower().endswith(
                    (".mov",".mp4",".m4v",".avi",".mkv",".webm",".mpg",".mpeg")):
                    out.append(f)
            tok = r.get("nextPageToken")
            if not tok: break
    return out

videos = list_videos(DRIVE_VIDEO_FOLDER_ID)
print(f"Found {len(videos)} video files:")
for v in videos:
    mb = int(v.get("size",0))/1e6 if v.get("size") else 0
    print(f"  · {v['name']}  ({mb:.0f} MB)")

# %% [4] TRANSCODE + UPLOAD ----------------------------------------------------
os.makedirs("in", exist_ok=True); os.makedirs("out", exist_ok=True)

def slug(name):
    s = re.sub(r"\.[^.]+$", "", name).lower()
    return re.sub(r"^-+|-+$", "", re.sub(r"[^a-z0-9]+", "-", s))

def download(fid, path):
    with io.FileIO(path, "wb") as fh:
        dl = MediaIoBaseDownload(fh, drive.files().get_media(fileId=fid, supportsAllDrives=True), chunksize=8*1024*1024)
        done = False
        while not done: _, done = dl.next_chunk()

def r2_exists(key):
    try: s3.head_object(Bucket=R2_BUCKET, Key=key); return True
    except Exception: return False

def upload(path, key):
    s3.upload_file(path, R2_BUCKET, key,
        ExtraArgs={"ContentType":"video/mp4","CacheControl":"public, max-age=31536000, immutable"})
    return f"{R2_PUBLIC_BASE.rstrip('/')}/{key}"

manifest = []
for v in videos:
    sg = slug(v["name"]); src = f"in/{sg}.src"
    master_key  = f"{R2_PREFIX}/{sg}.mp4"
    preview_key = f"{R2_PREFIX}/{sg}-preview.mp4"
    row = {"name": v["name"], "slug": sg, "master": None, "preview": None}

    if not OVERWRITE and r2_exists(master_key):
        row["master"] = f"{R2_PUBLIC_BASE.rstrip('/')}/{master_key}"
        if MAKE_PREVIEW and r2_exists(preview_key):
            row["preview"] = f"{R2_PUBLIC_BASE.rstrip('/')}/{preview_key}"
        print(f"↩︎ skip (exists): {v['name']}"); manifest.append(row); continue

    print(f"⬇︎  {v['name']}"); download(v["id"], src)

    master = f"out/{sg}.mp4"
    subprocess.run(["ffmpeg","-y","-i",src,
        "-vf",f"scale=-2:'min({MASTER_MAX_H},ih)'",
        "-c:v","libx264","-preset","medium","-crf",str(MASTER_CRF),
        "-maxrate",MASTER_MAXRATE,"-bufsize","12M","-pix_fmt","yuv420p",
        "-c:a","aac","-b:a","128k","-movflags","+faststart",master], check=True)
    row["master"] = upload(master, master_key)
    print(f"   ✔ master → {row['master']}")

    if MAKE_PREVIEW:
        prev = f"out/{sg}-preview.mp4"
        subprocess.run(["ffmpeg","-y","-i",src,"-t",str(PREVIEW_SECS),"-an",
            "-vf",f"scale=-2:{PREVIEW_H}","-c:v","libx264","-preset","medium",
            "-crf","26","-pix_fmt","yuv420p","-movflags","+faststart",prev], check=True)
        row["preview"] = upload(prev, preview_key)
        print(f"   ✔ preview → {row['preview']}")

    os.remove(src)
    manifest.append(row)

json.dump(manifest, open("video-manifest.json","w"), indent=2)
print("\nDone.")

# %% [5] URLS TO PASTE INTO /cms ----------------------------------------------
# For each project in /cms, paste the URL into its "Video URL (R2 / external)"
# field. Use the *preview* for the gallery's inline autoplay (smaller, muted);
# the *master* is the full web version.
print(f"{'PROJECT (from filename)':40} {'GALLERY (preview)':60} MASTER")
for r in manifest:
    print(f"{r['name'][:38]:40} {str(r.get('preview') or r['master'])[:58]:60} {r['master']}")
