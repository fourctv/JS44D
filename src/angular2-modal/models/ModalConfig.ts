import { Injectable } from '@angular/core';
let _defaultConfig: ModalConfig;


/**
 * A configuration definition object.
 * Instruction for how to show a modal.
 */
@Injectable()
export class ModalConfig {
    /**
     * Size of the modal.
     * 'lg', 'sm' or 'custom'.
     * NOTE: No validation.
     * Default to 'lg'
     */
    size: string;

    /**
     * Width of the modal.
     * used only if size is 'custom'.
     * NOTE: No validation.
     */
    customStyle: string;

    /**
     * Describes if the modal is blocking modal.
     * A Blocking modal is not closable by clicking outside of the modal window.
     * Defaults to false.
     */
    isBlocking: boolean;

    /**
     * Keyboard value/s that close the modal.
     * Accepts either a single numeric value or an array of numeric values.
     * A modal closed by a keyboard stroke will result in a 'reject' notification from the promise.
     * Defaults to 27, set `null` implicitly to disable.
     */
    keyboard: Array<number> | number;

    width: number = null;
    minWidth = 50;

    height: number = null;
    minHeight = 50;

    position = { top: 100, left: 100 };

    selfCentered = true;

    isModal = true;

    isDraggable = true;

    isResizable = true;

    title = '';

    actions: Array<string> = ['Close'];

    /**
      * Makes a ModalConfig instance valid.
      * @param config
      * @param defaultConfig A Default config to use as master, optional.
      * @returns {ModalConfig} The same config instance sent.
      */
    static makeValid(config: ModalConfig, defaultConfig?: ModalConfig) {
        defaultConfig = (defaultConfig) ? defaultConfig : _defaultConfig;

        if (!config.size) { config.size = defaultConfig.size; }

        if (config.isBlocking !== false) { config.isBlocking = true; }

        if (config.keyboard !== null) {
            if (Array.isArray(<Array<number>>config.keyboard)) {
                config.keyboard = (<Array<number>>config.keyboard).length === 0
                    ? defaultConfig.keyboard : config.keyboard;
            } else if (!isNaN(<number>config.keyboard)) {
                config.keyboard = [<number>config.keyboard];
            } else {
                config.keyboard = defaultConfig.keyboard;
            }
        }

        return config;
    }

    constructor() {
        this.size = 'ls';
        this.isBlocking = true;
        this.keyboard = [27];
    }


}

_defaultConfig = new ModalConfig();
