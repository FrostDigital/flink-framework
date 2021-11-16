import { ExpressResponse } from "@flink-app/flink";
import { log } from "@flink-app/flink";
import Handlebars from "handlebars";

export async function HandlebarsTemplateHandler(
    masterTemplate: string,
    styleTemplate: string,
    template: string,
    pageContext: { [key: string]: any },
    res: ExpressResponse
) {
    try {
        const master = Handlebars.compile(masterTemplate.replace("{{{body}}}", "###BODY###").replace("{{{style}}}", "###STYLE###"))(pageContext);
        const page = Handlebars.compile(template)(pageContext);
        res.send(master.replace("###BODY###", page).replace("###STYLE###", styleTemplate));
    } catch (ex) {
        log.error(ex);
        res.send("Template rendering error");
    }
}
