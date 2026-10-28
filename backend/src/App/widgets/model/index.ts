import Widget from "./widget.model";
import WidgetType from "./widget-type.model";
import Page from "../../Page/model/page.model";

Widget.belongsTo(WidgetType, {
  foreignKey: "widgetTypeId",
  as: "widgetType",
});

WidgetType.hasMany(Widget, {
  foreignKey: "widgetTypeId",
  as: "widgets",
});

Widget.belongsTo(Page, {
  foreignKey: "pageId",
  as: "page",
});

Page.hasMany(Widget, {
  foreignKey: "pageId",
  as: "widgets",
});



export { Widget, WidgetType };
