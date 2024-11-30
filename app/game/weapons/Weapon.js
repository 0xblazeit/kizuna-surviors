import BaseWeapon from './BaseWeapon';
import WandWeapon from './WandWeapon';
import HomingWeapon from './HomingWeapon';

export default class Weapon {
    static create(scene, owner, initialType = 'hotdog') {
        switch (initialType) {
            case 'wand':
                return new WandWeapon(scene, owner, initialType);
            case 'homing':
                return new HomingWeapon(scene, owner, initialType);
            default:
                return new BaseWeapon(scene, owner, initialType);
        }
    }
}