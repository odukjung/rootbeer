/* eslint-disable linebreak-style */
const BAMARAMA_BOX = 80086;
const ROOTBEER = 80081;
const TRASH = {
    80078: 'beer',
    80079: 'wine',
    80082: 'moongourd',
    80089: 'afro',
    80090: 'chefHat'
};
const HATS = [80089, 80090];
const ITEMS = [ROOTBEER, ...Object.keys(TRASH).map(id => Number(id))];
module.exports = function Rootbeer(mod) {
    let enabled = false;
    let timer = null;
    let myLoc = null;
    let statTotal = 0;
    let statRootbeer = 0;
    let readyToTrash = false;
    mod.game.initialize('inventory');
    mod.command.add('rootbeer', {
        $default() {
            if (!enabled) {
                enabled = true;
                if (findAll(BAMARAMA_BOX).length === 0) {
                    mod.command.message('You do not have any Bamarama Boxes. Stopping...');
                    stop(false);
                    return;
                }
                openBox();
                mod.command.message('Auto-Rootbeer started.');
            }
            else stop();
        }
    });
    mod.hook('S_SPAWN_ME', 3, event => { myLoc = event; });
    mod.hook('C_PLAYER_LOCATION', 5, event => { myLoc = event; });
    function openBox() {
        if(findAll(BAMARAMA_BOX).length === 0) {
            stop();
            return;
        }
        mod.send('C_USE_ITEM', 3, {
            gameId: mod.game.me.gameId,
            id: BAMARAMA_BOX,
            amount: 1,
            loc: myLoc.loc || 0,
            w: myLoc.w || 0,
            unk4: true
        });
        timer = mod.setTimeout(openBox, 1000); //backup if something fails
        checkItems();
    }
    function findAll(id) {
        return mod.game.inventory.findAllInBagOrPockets(id);
    }
    function deleteAndMerge() {

        findAll(Object.keys(TRASH).map(id => Number(id))).forEach(item => {
            if (mod.settings.autoTrashItems[TRASH[item.id]] && mod.settings.autoTrash) {
                //mod.command.message(`Deleting: ${item.data.name} (id: ${item.id}) x${item.amount}`)
                deleteItem(item);
            }
        });
        mergeHats();
    }
    function mergeHats() {
        let hats = {};
        HATS.forEach(id => {
            hats[id] = [];
            findAll(id).forEach(item => {
                hats[id].push(item);
            });
            while (hats[id].length >= 2) mergeItem(hats[id].pop(), hats[id][0]);
        });
    }
    function stop(active = true) {
        mod.clearTimeout(timer);
        enabled = false;
        readyToTrash = false;
        if (active) deleteAndMerge();
        mod.command.message('Auto-Rootbeer stopped.' + (!statTotal ? '' : ` Unboxed ${statRootbeer}/${statTotal} (${(Math.floor(statRootbeer / statTotal * 1000) / 10) || '0'}%).`));
		mod.command.message('ToTal Gold' + ' = ' + (`(${(statTotal * 5.35)}) g.`));
		mod.command.message('Per Each' + ' = ' + (`(${(((statTotal * 5.35)/statRootbeer))}) g.`));
        statTotal = statRootbeer = 0;
    }
    function deleteItem(item) {
        mod.send('C_DEL_ITEM', (mod.majorPatchVersion >= 85 ? 3 : 2), {
            gameId: mod.game.me.gameId,
            pocket: item.pocket,
            slot: item.slot,
            amount: item.amount
        });
    }
    function mergeItem(itemFrom, itemTo) {
        mod.send('C_MERGE_ITEM', (mod.majorPatchVersion >= 85 ? 2 : 1), {
            pocketFrom: itemFrom.pocket,
            slotFrom: itemFrom.slot,
            pocketTo: itemTo.pocket,
            slotTo: itemTo.slot
        });
    }
    function checkItems() {
        if(readyToTrash) {
            readyToTrash = false;
            deleteAndMerge();
        }
        findAll(Object.keys(TRASH).map(id => Number(id))).forEach(item => {
            const pocket = mod.game.inventory.pockets[item.pocket];
            if(item.amount >= 99 || (pocket.size - Object.keys(pocket.slots).length < 2)) readyToTrash = true;
        });
    }
    mod.hook('S_SYSTEM_MESSAGE_LOOT_ITEM', 1, event => {
        if (ITEMS.includes(event.item) && enabled) {
            mod.clearTimeout(timer);
            statTotal++;
            if (event.item === ROOTBEER) statRootbeer++;
            if(HATS.includes(event.item)) mergeHats();
            openBox();
        }
    });
    mod.hook('C_RETURN_TO_LOBBY', 'raw', () => {
        if (enabled) return false;
    });
    this.destructor = () => { mod.command.remove('rootbeer'); };
};
