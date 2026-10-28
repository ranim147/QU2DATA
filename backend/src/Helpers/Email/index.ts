const nodemailer = require("nodemailer");
import * as path from "path";
import * as fs from "fs";
const handlebars = require("handlebars");

const configPath = path.join(
  __dirname,
  "../../",
  "Config",
  "transporterConfig.json"
);

let transporterConfig;

try {
  const configData = fs.readFileSync(configPath, "utf-8");
  transporterConfig = JSON.parse(configData);
} catch (error) {
  console.error("Error reading config.json:", error);
  process.exit(1);
}
const { host, port, user, pass } = transporterConfig;
const transporter = nodemailer.createTransport({
  host: host,
  port: port,
  auth: {
    user: user,
    pass: pass,
  },
});
export const EmailVariables = {
  welcome: "Welcome To DataSense Pro",
};

interface emailTemplateVariable {
  att_name: string;
  att_value: string | number | Date;
}

export async function sendEmailHelperWithTemplate(
  receiver: string,
  subject: string,
  template: string,
  options?: emailTemplateVariable[]
) {
  const templatePath = path.join(
    __dirname,
    "../../",
    "emailTemplates",
    template
  );

  try {
    const templateContent = fs.readFileSync(templatePath, "utf-8");
    const templateToSend = handlebars.compile(templateContent);
    const convertedAtt = convertOptionsToAttributes(options);
    const htmlToSend = templateToSend(convertedAtt);
    const mailOptions = {
      from: "no-reply@qu2data.com",
      to: receiver,
      subject: subject,
      html: htmlToSend,
    };
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error reading template file:", error);
    // Handle error accordingly
  }
}

function convertOptionsToAttributes(options: emailTemplateVariable[]) {
  let attributes = {};

  options.forEach((element) => {
    attributes[element.att_name] = element.att_value;
  });

  return attributes;
}
