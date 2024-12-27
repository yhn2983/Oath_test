import express from "express";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import cookieParser from "cookie-parser";
import axios from "axios";

const app = express();
const port = 3000;
dotenv.config();

// 設定靜態檔案伺服器
// 取得 __filename 和 __dirname 的等效值
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

const client = new OAuth2Client({
  clientId: process.env.CLIENT_ID, // Google API Console 中生成的用戶端 ID
  clientSecret: process.env.SECRET_KEy, // 用戶端密鑰
  redirectUri: `${process.env.HOST}/callback`, // 用於 OAuth 流程的回調 URL
});

app.get("/", (req, res) => {
  res.render("index");
  //res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/login", (req, res) => {
  const authUrl = client.generateAuthUrl({
    access_type: "offline", // 獲取刷新令牌
    scope: [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    ], // 要求授權的範圍
  });
  //https://developers.google.com/identity/protocols/oauth2/scopes?hl=zh-tw 要求授權範圍參考網址
  console.log("Authorize this app by visiting this URL:", authUrl);
  res.redirect(authUrl);
});

app.get("/callback", async (req, res) => {
  const code = req.query.code;
  try {
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);
    // 透過 Google API 取得用戶資訊
    const userInfo = await client.request({
      url: "https://www.googleapis.com/oauth2/v3/userinfo",
    });
    //產生jwt
    const token = jwt.sign(userInfo.data, process.env.JWT_SECRET);
    res.cookie("token", token);
    res.redirect("/user");
  } catch (error) {
    console.log(error);
  }
});

const github_client = {
  clientId: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_SECRET_KEY,
  redirectUrl: `${process.env.HOST}/githubCallback`,
};
//參考文件 : https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps

app.post("/githubLogin", (req, res) => {
  const url = `https://github.com/login/oauth/authorize?client_id=${github_client.clientId}&scope=user`;
  res.redirect(url);
});

app.get("/githubCallback", async (req, res) => {
  const code = req.query.code;
  const authUrl = "https://github.com/login/oauth/access_token";
  try {
    const response = await axios
      .post(
        authUrl,
        {
          client_id: github_client.clientId,
          client_secret: github_client.clientSecret,
          code: code,
        },
        { headers: { Accept: "application/json" } }
      )
      .then((r) => r.data);

    const userResponse = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${response.access_token}` },
    });
    const user = userResponse.data;
    const token = jwt.sign(user, process.env.JWT_SECRET);
    res.cookie("token", token);
    res.redirect("/user");
  } catch (error) {
    console.log("錯誤:" + error);
  }
});

//TODO:middleware
function authToken(req, res, next) {
  const token = req.cookies.token;
  if (!token) {
    return res.render("/", { msg: "請先登入" });
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user;
    next();
  } catch (error) {
    console.log("錯誤訊息:" + error);
  }
}

app.get("/user", authToken, (req, res) => {
  res.render("user", {
    msg: "success",
    user: req.user,
  });
});
app.get("/userApi", authToken, (req, res) => {
  res.json({
    msg: "success",
    user: req.user,
  });
});

app.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/");
});

app.listen(port, () => {
  console.log(`listen port ${port}`);
});
