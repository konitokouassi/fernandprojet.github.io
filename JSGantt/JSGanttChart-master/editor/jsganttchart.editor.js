/*jslint nomen: true*/
(function ($, _, Backbone, JSGanttChart) {
  "use strict";

  var ToolbarView = Backbone.View.extend({
      className: "toolbar",
      $el: undefined,

      initialize: function () {
        this.$el = $(this.el);
      },

      render: function () {
        var this_ = this;
        $.fn.append.apply(
          this.$el.html(""),
          _(this.options.buttons).map(function (button) {
            return jQuery(
              '<input type="button" value="' + button.name + '">'
            ).click(function () {
              button.action.call(this_);
            });
          })
        );
        return this;
      },
    }),
    FieldSetView = Backbone.View.extend({
      className: "fieldset",
      tagName: "table",
      $el: undefined,
      fieldInputs: undefined,
      model: undefined,
      initialize: function () {
        this.$el = $(this.el);
      },
      render: function () {
        var this_ = this;
        this.fieldInputs = [];
        $.fn.append.apply(
          this.$el.html(""),
          _(this.options.fields).map(function (field) {
            var html =
                field.type === "textarea"
                  ? '<textarea rows="6" cols="60"></textarea>'
                  : '<input type="text" value="">',
              row = jQuery(
                "<tr><th>" + field.name + "</th><td>" + html + "</td></tr>"
              ),
              input = row.find("input, textarea");
            this_.fieldInputs.push(input);
            switch (field.type) {
              case "date":
                input.datepicker({
                  dateformar: "D d M yy",
                });
                break;
            }
            return row;
          })
        );
        return this;
      },
      load: function (model) {
        var this_ = this;
        this.model = model;
        _(this.options.fields).each(function (field, i) {
          this_.fieldInputs[i].val(field.load(model));
        });
      },
      save: function () {
        var this_ = this,
          newsettings = {};
        _(this.options.fields).each(function (field, i) {
          _(newsettings).extend(
            field.save(this_.model, this_.fieldInputs[i].val())
          );
        });
        this.model.save(newsettings);
      },
    }),
    DialogView = Backbone.View.extend({
      className: "dialog",
      $el: undefined,
      initialize: function () {
        this.dialogOptions = {
          autoOpen: false,
          show: "fade",
          hide: "fade",
        };
        this.$el = $(this.el);
      },
      show: function () {
        this.$el.dialog("open");
      },
      hide: function () {
        this.$el.dialog("close");
      },
      render: function () {
        this.$el.dialog(this.dialogOptions);
        return this;
      },
    }),
    EditDialogView = DialogView.extend({
      fieldset: undefined,
      model: undefined,
      render: function () {
        var this_ = this,
          apply = function () {
            this_.fieldset.save();
          };

        _(this.dialogOptions).extend({
          buttons: {
            Apply: function () {
              apply.call();
            },
            OK: function () {
              apply.call();
              this_.hide();
            },
            Cancel: function () {
              this_.hide();
            },
            Delete: function () {
              this_.model.destroy();
              this_.hide();
            },
          },
          title: "Add / Edit stage",
          resizable: false,
          width: 600,
        });

        this.fieldset = new FieldSetView({
          fields: [
            {
              name: "Identifiant",
              load: function (model) {
                return model.get("identifiant");
              },
              save: function (model, value) {
                return { identifiant: value };
                model.collection.sort();
              },
            },
            {
              name: "Ordre",
              load: function (model) {
                return model.get("ordre");
              },
              save: function (model, value) {
                return { ordre: parseInt(value) };
              },
            },
            {
              name: "Nom",
              load: function (model) {
                return model.get("nom");
              },
              save: function (model, value) {
                return { name: value };
              },
            },
            {
              name: "Description",
              type: "Aire texte",
              load: function (model) {
                return model.get("description");
              },
              save: function (model, value) {
                return { description: value };
              },
            },
            {
              name: "Date de d??but",
              type: "date",
              load: function (model) {
                return model.get("Date de d??but");
              },
              save: function (model, value) {
                return { startDate: value ? new Date(value) : undefined };
              },
            },
            {
              name: "Date de fin",
              type: "date",
              load: function (model) {
                return model.get("Date de  fin");
              },
              save: function (model, value) {
                return { endDate: value ? new Date(value) : undefined };
              },
            },
            {
              name: "Diminuez une Date de fin",
              type: "date",
              load: function (model) {
                return model.get("Diminuez une Date de fin");
              },
              save: function (model, value) {
                return { slackEndDate: value ? new Date(value) : undefined };
              },
            },
            {
              name: "Type",
              load: function (model) {
                return model.get("type");
              },
              save: function (model, value) {
                return { type: value };
              },
            },
            {
              name: "Parent",
              load: function (model) {
                return model.get("parentElement");
              },
              save: function (model, value) {
                console.log({
                  parentElement: value.trim() === "" ? undefined : value.trim(),
                });
                return {
                  parentElement: value.trim() === "" ? undefined : value.trim(),
                };
              },
            },
            {
              name: "Pourcentage faire",
              load: function (model) {
                return model.get("Pourcentage faire");
              },
              save: function (model, value) {
                return {
                  percentageDone:
                    value === undefined ? undefined : parseInt(value),
                };
              },
            },
            {
              name: "Heure attendue",
              load: function (model) {
                return model.get("Heure attendue");
              },
              save: function (model, value) {
                return {
                  estimatedHours:
                    value === undefined ? undefined : parseInt(value),
                };
              },
            },
            {
              name: "Resource (comma separated)",
              load: function (model) {
                return (model.get("resources") || []).join(", ");
              },
              save: function (model, value) {
                return {
                  resources: _(value.split(","))
                    .chain()
                    .map(function (r) {
                      return r.trim();
                    })
                    .reject(function (r) {
                      return r === "";
                    })
                    .value(),
                };
              },
            },
            {
              name: "Predecesseur (dependancies,<br />comma separated)",
              load: function (model) {
                return (model.get("predecesseur") || []).join(", ");
              },
              save: function (model, value) {
                return {
                  predecesseur: _(value.split(","))
                    .chain()
                    .map(function (r) {
                      return r.trim();
                    })
                    .reject(function (r) {
                      return r === "";
                    })
                    .value(),
                };
              },
            },
            {
              name: "Ic??ne",
              type: "Aire texte",
              load: function (model) {
                return JSON.stringify(model.get("ic??ne") || []);
              },
              save: function (model, value) {
                var ic??ne = JSON.parse(value);
                _(ic??ne).each(function (ic??ne) {
                  ic??ne.date = new Date(ic??ne.date);
                });
                return { ic??ne: ic??ne };
              },
            },
          ],
        });

        this.$el.html("").append(this.fieldset.render().el);
        return DialogView.prototype.render.apply(this);
      },
      load: function (model) {
        this.model = model;
        this.fieldset.load(model);
      },
    }),
    JSONDialogView = DialogView.extend({
      textarea: undefined,

      render: function () {
        var this_ = this,
          textarea = jQuery("<textarea></textarea>"),
          apply = function () {
            this_.options.gantt.setJSON(JSON.parse(this_.val()));
          },
          toolbar = new ToolbarView({
            buttons: [
              {
                name: "Apply",
                action: function () {
                  apply.call();
                },
              },
              {
                name: "OK",
                action: function () {
                  apply.call();
                  this_.hide();
                },
              },
              {
                name: "Cancel",
                action: function () {
                  this_.hide();
                },
              },
            ],
          });

        this.textarea = textarea;

        this.$el.html("").append(textarea, toolbar.render().el).hide();

        return DialogView.prototype.render.apply(this);
      },
      val: function () {
        return $.fn.val.apply(this.textarea, arguments);
      },
    }),
    EditorView = Backbone.View.extend({
      className: "editor",
      $el: undefined,
      gantt: undefined,
      editDialog: undefined,
      jsonDialog: undefined,
      toolbar: undefined,

      initialize: function () {
        var this_ = this;
        this.$el = $(this.el);
        this.gantt = this.options.gantt;
        this.editDialog = new EditDialogView();
        this.jsonDialog = new JSONDialogView({ gantt: this.gantt });
        this.toolbar = new ToolbarView({
          buttons: [
            {
              name: "Taches",
              action: function () {
                this_.editDialog.load(this_.gantt.newElementModel());
                this_.editDialog.show();
              },
            },
            // {
            //   name: "View Resources",
            //   action: function () {
            //     this_.resourcesDialog.show();
            //   },
            // },
            // {
            //   name: "View Types",
            //   action: function () {
            //     this_.resourcesDialog.show();
            //   },
            // },
            // {
            //   name: "View/Edit JSON",
            //   action: function () {
            //     this_.jsonDialog.val(
            //       JSON.stringify(this_.gantt.getJSON(), undefined, "    ")
            //     );
            //     this_.jsonDialog.show();
            //   },
            // },
          ],
        });

        this.gantt.bind("row_click", function (e, model) {
          e.preventDefault();
          e.stopPropagation();
          this_.editDialog.load(model);
          this_.editDialog.show();
        });
      },
      render: function () {
        this.$el
          .html("")
          .append(this.gantt.render().el, this.toolbar.render().el);
        this.editDialog.render();
        this.jsonDialog.render();
        return this;
      },
    }),
    editor;

  JSGanttChart.Editor = function (options) {
    editor = new EditorView({ gantt: options.gantt });
  };

  _(JSGanttChart.Editor).extend({
    create: function () {
      var F = function () {}, // Dummy function
        o;
      F.prototype = JSGanttChart.Editor.prototype;
      o = new F();
      JSGanttChart.Editor.apply(o, arguments);
      o.constructor = JSGanttChart.Editor;
      return o;
    },
  });

  _(JSGanttChart.Editor.prototype).extend(Backbone.Events, {
    render: function () {
      return editor.render();
    },
  });
})(jQuery, _, Backbone, JSGanttChart);
