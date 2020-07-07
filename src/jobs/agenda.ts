import AgendaService from "../db/services/agenda";

export async function prepareAgenda(): Promise<void> {
    const agenda = await AgendaService.get();
    agenda.forEach((element) => {
        if (element.when > new Date()) {
            AgendaService.remove(element.id);
            return;
        }
        // TODO: start a schedule
    });
}