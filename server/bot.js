// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// Import required Bot Framework classes.
import {ActivityTypes, CardFactory} from 'botbuilder';
import {
  ChoicePrompt,
  DialogSet,
  NumberPrompt,
  TextPrompt,
  WaterfallDialog,
} from 'botbuilder-dialogs';

import SlotFillingDialog from './slotFillingDialog';
import SlotDetails from './slotDetails';

const DIALOG_STATE_PROPERTY = 'dialogState';
const WELCOMED_USER = 'welcomedUserProperty';

export default class WelcomeBot {
  constructor (conversationState) {
    this.conversationState = conversationState;

    // Create a property used to store dialog state.
    // See https://aka.ms/about-bot-state-accessors to learn more about bot state and state accessors.
    this.dialogState = this.conversationState.createProperty(DIALOG_STATE_PROPERTY);
    this.welcomedUserProperty = this.conversationState.createProperty(WELCOMED_USER);

    // Create a dialog set to include the dialogs used by this bot.
    this.dialogs = new DialogSet(this.dialogState);

    // Link the questions together into a parent group that contains references
    // to both the fullname and address questions defined above.
    const slots = [
      new SlotDetails('color', 'choice', 'Пожалуйста выберите цвет.', 'Вы должны выбрать.', ['Желтый', 'Зеленый', 'Синий']),
      new SlotDetails('fullname', 'text', 'Пожалуйста введите полное имя.'),
      new SlotDetails('city', 'text', 'Пожалуйста введите ваш город.'),
      new SlotDetails('warehouse', 'number', 'Пожалуйста введите номер отделения Новой Почты.'),
    ];

    // Add the individual child dialogs and prompts used.
    // Note that the built-in prompts work hand-in-hand with our custom SlotFillingDialog class
    // because they are both based on the provided Dialog class.
    this.dialogs.add(new TextPrompt('text'));
    this.dialogs.add(new NumberPrompt('number'));
    this.dialogs.add(new ChoicePrompt('choice'));
    this.dialogs.add(new SlotFillingDialog('slot-dialog', slots));

    // Finally, add a 2-step WaterfallDialog that will initiate the SlotFillingDialog,
    // and then collect and display the results.
    this.dialogs.add(new WaterfallDialog('root', [
      ::this.startDialog,
      ::this.processResults,
    ]));
  }

  // This is the first step of the WaterfallDialog.
  // It kicks off the dialog with the multi-question SlotFillingDialog,
  // then passes the aggregated results on to the next step.
  startDialog (step) {
    return step.beginDialog('slot-dialog');
  }

  // This is the second step of the WaterfallDialog.
  // It receives the results of the SlotFillingDialog and displays them.
  async processResults (step) {
    // Each "slot" in the SlotFillingDialog is represented by a field in step.result.values.
    // The complex that contain subfields have their own .values field containing the sub-values.

    const {color, fullname, city, warehouse} = step.result.values;
    await step.context.sendActivity(`Ваш заказ 'Перчатки Lovely Gloves (цвет ${color.value})' принят в обработку и будет доставлен в отделение Новой Почты №${warehouse} города ${city}, получатель ${fullname}`);
    // await step.context.sendActivity({attachments: [this.createReceiptCard(step.result.values)]});

    return step.endDialog();
  }

  async onTurn (turnContext) {
    // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
    if (turnContext.activity.type === ActivityTypes.Message) {
      // Create dialog context.
      const dc = await this.dialogs.createContext(turnContext);

      const utterance = (turnContext.activity.text || '').trim().toLowerCase();
      if (utterance === 'отмена') {
        if (dc.activeDialog) {
          await dc.cancelAllDialogs();
          await dc.context.sendActivity(`Хорошо... отмена.`);
        } else {
          await dc.context.sendActivity(`Нечего отменять :)`);
        }
      }

      if (!dc.context.responded) {
        // Continue the current dialog if one is pending.
        await dc.continueDialog();
      }

      if (!dc.context.responded) {
        // If no response has been sent, start the onboarding dialog.
        await dc.beginDialog('root');
      }
    } else if (turnContext.activity.type === ActivityTypes.ConversationUpdate) {
      // Do we have any new members added to the conversation?
      if (turnContext.activity.membersAdded.length !== 0) {
        // Iterate over all new members added to the conversation
        for (var idx in turnContext.activity.membersAdded) {
          // Greet anyone that was not the target (recipient) of this message.
          // Since the bot is the recipient for events from the channel,
          // context.activity.membersAdded === context.activity.recipient.Id indicates the
          // bot was added to the conversation, and the opposite indicates this is a user.
          if (turnContext.activity.membersAdded[idx].id !== turnContext.activity.recipient.id) {
            // Send a "this is what the bot does" message.
            await this.sayHello(turnContext);
          }
        }
      }
    } else {
      // Generic message for all other activities
      console.log(`[${turnContext.activity.type} event detected]`);
    }

    await this.conversationState.saveChanges(turnContext);
  }

  async sayHello (turnContext) {
    // Read conversationState. If the 'DidBotWelcomedUser' does not exist (first time ever for a user)
    // set the default to false.
    let didBotWelcomedUser = await this.welcomedUserProperty.get(turnContext, false);

    // Your bot should proactively send a welcome message to a personal chat the first time
    // (and only the first time) a user initiates a personal chat with your bot.
    if (didBotWelcomedUser === false) {
      // The channel should send the user name in the 'From' object
      let userName = turnContext.activity.from.name;
      await turnContext.sendActivity(`Привет ${userName}. Я - робот, который поможет Вам сделать заказ. Напишите что-нибудь, если хотите продолжить. Напишите 'отмена', что бы начать с начала.`);

      // Set the flag indicating the bot handled the user's first message.
      await this.welcomedUserProperty.set(turnContext, true);
    }
  }

  createReceiptCard (values) {
    const {color, fullname, city, warehouse, quantity = 1} = values;
    const price = 699;
    return CardFactory.receiptCard({
      title: fullname,
      facts: [{
        key: 'Город',
        value: city,
      }, {
        key: 'Номер отделения НП',
        value: warehouse,
      }],
      items: [{
        title: `Lovely Gloves (${color.value})`,
        price: `${price}₴`,
        quantity,
        image: {url: 'https://lovelygloves.com.ua/img/10536262_2560/image.jpg'},
      }],
      tax: '0',
      total: `${price * quantity}₴`,
    });
  }
}
