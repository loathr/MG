import { siteSettings } from "./siteSettings";
import { project } from "./project";
import { post } from "./post";
import { aboutPage } from "./pages/aboutPage";
import { whatWeDoPage } from "./pages/whatWeDoPage";
import { contactPage } from "./pages/contactPage";
import { newsletterPage } from "./pages/newsletterPage";

export const schemaTypes = [
  siteSettings, project, post,
  aboutPage, whatWeDoPage, contactPage, newsletterPage,
];
