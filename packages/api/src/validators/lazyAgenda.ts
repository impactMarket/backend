import { Joi, celebrate } from 'celebrate';
import { defaultSchema } from './defaultSchema';

// I wish this comes true https://github.com/hapijs/joi/issues/2864#issuecomment-1322736004

// This should match Joi validations
type AddUserLazyAgendaItem = {
    type: number;
    details: object;
    frequency: number;
};
const addUserLazyAgendaItemValidator = celebrate({
    body: defaultSchema.object<AddUserLazyAgendaItem>({
        type: Joi.number().required(),
        details: Joi.object().optional(),
        frequency: Joi.number().required()
    })
});

export { addUserLazyAgendaItemValidator, AddUserLazyAgendaItem };
