// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// Import required Bot Framework classes.
import {ActivityTypes, CardFactory} from 'botbuilder';

// Welcomed User property name
const WELCOMED_USER = 'welcomedUserProperty';

export default class WelcomeBot {
  /**
   *
   * @param {UserState} User state to persist boolean flag to indicate
   *                    if the bot had already welcomed the user
   */
  constructor (userState) {
    // Creates a new user property accessor.
    // See https://aka.ms/about-bot-state-accessors to learn more about the bot state and state accessors.
    this.welcomedUserProperty = userState.createProperty(WELCOMED_USER);

    this.userState = userState;
  }

  /**
   *
   * @param {TurnContext} context on turn context object.
   */
  async onTurn (turnContext) {
    // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
    if (turnContext.activity.type === ActivityTypes.Message) {
      // Read UserState. If the 'DidBotWelcomedUser' does not exist (first time ever for a user)
      // set the default to false.
      let didBotWelcomedUser = await this.welcomedUserProperty.get(turnContext, false);

      // Your bot should proactively send a welcome message to a personal chat the first time
      // (and only the first time) a user initiates a personal chat with your bot.
      if (didBotWelcomedUser === false) {
        // The channel should send the user name in the 'From' object
        let userName = turnContext.activity.from.name;
        await turnContext.sendActivity(`Привет ${userName}.`);

        // Set the flag indicating the bot handled the user's first message.
        await this.welcomedUserProperty.set(turnContext, true);
      }

      await turnContext.sendActivity({
        text: 'Intro Hero Cards',
        attachments: [this.createHeroCard(), this.createHeroCard()],
      });

      // Save state changes
      await this.userState.saveChanges(turnContext);
    } else {
      // Generic message for all other activities
      console.log(`[${turnContext.activity.type} event detected]`);
    }
  }

  createHeroCard () {
    return CardFactory.heroCard(
      'BotFramework Hero Card',
      CardFactory.images(['https://sec.ch9.ms/ch9/7ff5/e07cfef0-aa3b-40bb-9baa-7c9ef8ff7ff5/buildreactionbotframework_960.jpg']),
      CardFactory.actions([
        {
          type: 'openUrl',
          title: 'Get started',
          value: 'https://docs.microsoft.com/en-us/azure/bot-service/',
        },
      ]),
    );
  }
}
