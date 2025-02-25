import { ExpressRequest, ExpressResponse } from "@flink-app/flink";
import fs from "fs/promises";
import { log } from "@flink-app/flink";
import Handlebars from "handlebars";

const defaultTemplate = `<html>
<head>
  <title>Password reset</title>
  <link rel="stylesheet" href="form/style.css" />
  <script src="form/script.js" type="text/javascript"></script>
</head>
<body>
  <form id="form">
    <p>Please enter new password</p>
    <input type="password" name="password" placeholder="Enter new password" />
    <input
      type="password"
      name="confirmPassword"
      placeholder="Confirm new password"
    />
    <button id="submit-btn">Submit</button>
  </form>
  <div id="success">Password has been updated, please proceed to login.</div>
</body>
</html>
`;

const script = `
      window.onload = () => {
      const urlSearchParams = new URLSearchParams(window.location.search);
      const params = Object.fromEntries(urlSearchParams.entries());
      const { token, code } = params;

      if (!token) {
        alert("Missing token");
      } else if (!code) {
        alert("Missing code");
      }

      const submitBtnEl = document.getElementById("submit-btn");
      const [passwordInputEl, confirmPasswordEl] =
        document.getElementsByTagName("input");

      submitBtnEl.onclick = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!passwordInputEl.value) {
          return alert("Enter a new password");
        } else if (passwordInputEl.value !== confirmPasswordEl.value) {
          return alert(
            "Passwords does not match, make sure that new and confirmed passwords are the same"
          );
        }

        const res = await window.fetch("{{completeUrl}}", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            passwordResetToken: token,
            code: code,
            password: passwordInputEl.value,
          }),
        });

        if (res.status > 399) {
          alert("Failed to set new password");
        } else {
          document.getElementById("form").style.display = "none";
          document.getElementById("success").style.display = "block";
        }
      };
    };
`;

const style =` * {
      box-sizing: border-box;
      font-family: Arial, Helvetica, sans-serif;
    }

    p {
      margin: 0.5rem 0;
    }

    body {
      padding: 1rem;
    }

    form {
      display: block;
      max-width: 320px;
    }

    input {
      width: 100%;
      display: block;
      margin: 0.5rem 0;
    }

    #success {
      display: none;
      font-size: 1.2rem;
      color: rgb(0, 177, 115);
      max-width: 350px;
    }
`;

export async function handleUserPasswordResetForm(
  _req: ExpressRequest,
  res: ExpressResponse,
  { templateFile, completeUrl }: { templateFile?: string; completeUrl: string }
) {
  const tpl = await readTemplate(templateFile);

  const html = Handlebars.compile(tpl)({
    completeUrl,
  });

  res.send(html);
}

export async function resetPasswordFormScript(req: ExpressRequest, res: ExpressResponse, { completeUrl }: { completeUrl: string }) {
    res.header("Content-Type", "application/javascript");
    const js = Handlebars.compile(script)({completeUrl});
    res.send(js);
}

export async function resetPasswordFormCss(res: ExpressResponse) {
  res.header("Content-Type", "text/css");
  res.send(style);
}

let cachedTemplate = "";

async function readTemplate(templateFilename?: string) {
  if (!cachedTemplate) {
    if (templateFilename) {
      try {
        const buff = await fs.readFile(templateFilename);
        cachedTemplate = buff.toString();
      } catch (err) {
        log.error(
          "Failed reading template file for password reset",
          templateFilename,
          err
        );
        throw err;
      }
    } else {
      cachedTemplate = defaultTemplate;
    }
  }

  return cachedTemplate;
}
