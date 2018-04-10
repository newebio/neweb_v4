import cookieParser = require("cookie-parser");
export async function parseRequestCookies(request: any) {
    await new Promise((resolve) => {
        cookieParser()(request, {} as any, resolve);
    });
}
