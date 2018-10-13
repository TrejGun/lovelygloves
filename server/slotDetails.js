// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

export default class SlotDetails {
  /**
   * SlotDetails is a small class that defines a "slot" to be filled in a SlotFillingDialog.
   * @param {string} name The field name used to store user's response.
   * @param {string} promptId A unique identifier of a Dialog or Prompt registered on the DialogSet.
   * @param {string} prompt The text of the prompt presented to the user.
   * @param {string} retryPrompt (optional) The text to present if the user responds with an invalid value.
   * @param {array} choices (optional) The text to present if the user responds with an invalid value.
   */
  constructor (name, promptId, prompt, retryPrompt, choices) {
    this.name = name;
    this.promptId = promptId;
    this.options = {
      prompt,
      retryPrompt,
      choices,
    };
  }
}
