import AgendaService from '@services/app/agenda';
import schedule from 'node-schedule';

import { AgendaAction } from '../../types';

export async function prepareAgenda(): Promise<void> {
    const agenda = await AgendaService.get();
    agenda.forEach((element) => {
        if (element.when > new Date()) {
            AgendaService.remove(element.id);
            return;
        }
        if (element.action === AgendaAction.notification) {
            schedule.scheduleJob(element.when, () => {
                // console.log('The world is going to end today.');
                // TODO: throw user notification
            });
        }
    });
}
