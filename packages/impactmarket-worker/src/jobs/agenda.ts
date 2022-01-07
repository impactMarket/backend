import { services, types } from 'impactmarket-core';
import schedule from 'node-schedule';

export async function prepareAgenda(): Promise<void> {
    const agenda = await services.app.AgendaService.get();
    agenda.forEach((element) => {
        if (element.when > new Date()) {
            services.app.AgendaService.remove(element.id);
            return;
        }
        if (element.action === types.AgendaAction.notification) {
            schedule.scheduleJob(element.when, () => {
                // console.log('The world is going to end today.');
                // TODO: throw user notification
            });
        }
    });
}
