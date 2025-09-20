export const msalConfig = {
  auth: {
    clientId: "844b2a66-50f5-4263-991c-7475671e28b1", // SPA app client ID
    authority: "https://login.microsoftonline.com/ee725937-db98-4a75-9625-8f69cc37b716",
    redirectUri: "http://localhost:3000",
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: false,
  },
};

export const loginRequest = {
  scopes: ["openid", "profile", "email"],
};
