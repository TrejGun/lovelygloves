// Import required packages
import restify from 'restify';

// Import required bot services. See https://aka.ms/bot-services to learn more about the different parts of a bot.
import {BotFrameworkAdapter, ConversationState, MemoryStorage} from 'botbuilder';
import LovelyGlovesBot from './bot';

// Create bot adapter.
// See https://aka.ms/about-bot-adapter to learn more about bot adapter.
const adapter = new BotFrameworkAdapter({
  appId: process.env.MICROSOFT_APP_ID,
  appPassword: process.env.MICROSOFT_APP_PASSWORD,
});

// Catch-all for any unhandled errors in your bot.
adapter.onTurnError = async (context, error) => {
  // This check writes out errors to console log .vs. app insights.
  console.error(`\n [onTurnError]: ${error}`);
  // Send a message to the user
  context.sendActivity(`Oops. Something went wrong!`);
  // Clear out state
  await conversationState.clear(context);
  // Save state changes.
  await conversationState.saveChanges(context);
};

// For local development, in-memory storage is used.
// CAUTION: The Memory Storage used here is for local bot debugging only. When the bot
// is restarted, anything stored in memory will be gone.
const memoryStorage = new MemoryStorage();

// Define a state store for your bot. See https://aka.ms/about-bot-state to learn more about using MemoryStorage.
// A bot requires a state store to persist the dialog and user state between messages.
const conversationState = new ConversationState(memoryStorage);

// Create the main dialog.
const bot = new LovelyGlovesBot(conversationState);

// Create HTTP server
let server = restify.createServer();
server.listen(process.env.PORT || 3978, function () {
  console.log(`${server.name} listening to ${server.url}`);
  console.log(`Get Bot Framework Emulator: https://aka.ms/botframework-emulator`);
  console.log(`To talk to your bot, open lovely_gloves.bot file in the Emulator`);
});

// Listen for incoming activities and route them to your bot main dialog.
server.post('/api/messages', (req, res) => {
  adapter.processActivity(req, res, async (turnContext) => {
    // route to main dialog.
    await bot.onTurn(turnContext);
  });
});

// Catch-all for errors.
adapter.onTurnError = async (context, error) => {
  // This check writes out errors to console log .vs. app insights.
  console.error(`[onTurnError]: ${error}`);
  // Send a message to the user
  context.sendActivity(`Oops. Something went wrong!`);
  // Clear out state
  conversationState.clear(context);
};
