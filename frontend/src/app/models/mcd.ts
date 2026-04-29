import { Entities } from './entities';
import { Association } from './associations';

export class Mcd {
    constructor(
        public Entities : Entities[] = [],
        public Association : Association[]= []
    ){}
}
