// written with the help of ChatGPT
import { google } from "googleapis";

const CLIENT_ID = "870687804326-74jdf4np4ve2cn9usl45giblnud12ah6.apps.googleusercontent.com";
const CLIENT_SECRET = "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";

// The redirect URI for the Desktop OAuth2 flow
// TODO: do this in rust
const REDIRECT_URI = 'urn:ietf:wg:oauth:2.0:oob';

const SCOPES = [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/calendar.events"
];

const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
);

export const getAuthURL = () => {
    const url = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: SCOPES.join(" ")
    });
    return url;
}


