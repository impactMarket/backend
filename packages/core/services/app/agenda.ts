import { Agenda } from '@models/app/agenda';

export default class AgendaService {
    public static async add(
        when: Date,
        action: string,
        data: any
    ): Promise<Agenda> {
        return Agenda.create({
            when,
            action,
            data,
        });
    }

    public static async get(): Promise<Agenda[]> {
        return Agenda.findAll({ raw: true });
    }

    public static async remove(id: number): Promise<number> {
        return Agenda.destroy({ where: { id } });
    }
}
