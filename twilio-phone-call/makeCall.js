// Download the helper library from https://www.twilio.com/docs/node/install
require('dotenv').config();
const twilio = require("twilio");

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

async function createCall() {
  try {
    const call = await client.calls.create({
      from: "+13369336477",
      to: "+918712347304",
      url: `${process.env.BASE_URL}/ivr/welcome`,
    });
    console.log("Call initiated successfully!");
    console.log("Call SID:", call.sid);
  } catch (error) {
    console.error("Error making call:", error.message);
  }
}

createCall();

