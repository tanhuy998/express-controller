/**
 * @typedef {import('../phase/phase.js')} Phase
 * @typedef {import('../../context/context.js')} Context
 * @typedef {import('../../handler/constextHandler.js')} ContextHandler
 */

module.exports = class Payload {

    #id = Date.now();

    /**@type {Context} */
    #context;

    #stackStrace = [];

    /**@type {Phase} */
    #currenPhase;

    #handleInstannce;

    #controller;

    #pipeline;

    get pipeline() {

        return this.#pipeline;
    }

    get controller() {

        return this.#controller;
    }

    get trace() {

        return this.#stackStrace;
    }

    get lastHandledValue() {

        const length = this.#stackStrace.length;

        const last = length > 0 ? length - 1 : 0;

        return this.#stackStrace[last];
    }

    get currentPhase() {

        return this.#currenPhase;
    }

    get context() {

        return this.#context;
    }

    get handler() {

        return this.#handleInstannce;
    }

    get id() {

        return this.#id;
    }

    /**
     * 
     * @param {Context} _context 
     */
    constructor(_context, _controller, _pipeline) {

        this.#context = _context;
        this.#controller = _controller;
        this.#pipeline = _pipeline;
    }

    /**
     * 
     * @param {Phase} _phase 
     * @param {ContextHandler?} _handler 
     */
    switchPhase(_phase) {

        this.#currenPhase = _phase;
    }
}