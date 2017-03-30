module.exports = {
  /**
   * Generate routes for controller handlers.
   * You can set controllers to true/false to enable/disable
   * automatic footprints routes globaly
   */
  controllers: {

    /**
     * Default methods to accept for routes generated from controller handlers.
     */
    method: '*',

    /**
     * List of controllers to ignore; that is, do not generate footprint routes
     * for them.
     */
    ignore: [ ]
  },

  /**
   * Generate conventional Create, Read, Update, and Delete (CRUD) routes for
   * each Model.
   */
  models: {
    options: {

      /**
       * The max number of objects to return by default. Can be overridden in
       * the request using the ?limit argument.
       */
      defaultLimit: 100,

      /**
       * Subscribe to changes on requested models via WebSocket
       * (support provided by trailpack-websocket)
       */
      watch: false,

      /**
       * Whether to populate all model associations by default (for "find")
       */
      populate: false
    },

    actions: {
      create: true,
      find: true,
      update: true,
      destroy: true,

      /**
       * Specify which "association" endpoints to activate.
       */
      createAssociation: true,
      findAssociation: true,
      updateAssociation: true,
      destroyAssociation: true
    }
  }
};
