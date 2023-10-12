import { AppLazyAgenda, AppLazyAgendaCreation } from '../../interfaces/app/appLazyAgenda';
import { models } from '../../database';

export default class LazyAgendaService {
    public async get(userId: number): Promise<AppLazyAgenda[]> {
        const lazyAgenda = await models.appLazyAgenda.findAll({
            where: { userId }
        });
        return lazyAgenda.map(la => la.toJSON());
    }

    public async add(item: AppLazyAgendaCreation): Promise<AppLazyAgenda> {
        const lazyAgenda = await models.appLazyAgenda.create(item);
        return lazyAgenda.toJSON();
    }

    public async delete(userId: number, id: number): Promise<void> {
        await models.appLazyAgenda.destroy({
            where: { id, userId }
        });
    }
}
