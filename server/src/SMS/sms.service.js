// SMS Service: Handles sending SMS notifications using SMSGatewayHub / BSNL DLT

import axios from "axios";

export const sendSMS = async ({
  mobile,
  message,
  templateId,
}) => {

  try {

    console.log("📤 Sending SMS...");
    console.log("📱 Mobile:", mobile);
    console.log("📝 Message:", message);
    console.log("🆔 Template ID:", templateId);

    const response = await axios.get(
      process.env.SMS_API_URL,
      {
        params: {
          user: process.env.SMS_USER,
          password: process.env.SMS_PASSWORD,

          senderid: process.env.SMS_SENDER_ID,

          channel: "Trans",

          DCS: 0,

          flashsms: 0,

          number: mobile,

          text: message,

          route: 1,

          dlttemplateid: templateId,
        },
      }
    );

    console.log(
      `✅ SMS Sent To ${mobile}`
    );

    console.log("📨 SMS Response:", response.data);

    return response.data;

  } catch (error) {

    console.error(
      "❌ SMS Error:",
      error.response?.data || error.message
    );

    return null;
  }
};