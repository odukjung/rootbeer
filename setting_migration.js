/* eslint-disable linebreak-style */
'use strict';

let DefaultSettings = {
    'autoTrash': true,
    'autoTrashItems': {
        'beer': true,
        'wine': true,
        'moongourd': true,
        'afro': true,
        'chefHat': true
    }
};

module.exports = function MigrateSettings(from_ver, to_ver, settings) {
    if(from_ver === undefined) {
        try {
            delete settings.lotus;
        // eslint-disable-next-line no-empty
        } catch(e) {}
        return Object.assign(Object.assign({}, DefaultSettings), settings);
    } else if(from_ver === null) {
        return DefaultSettings;
    } else {
		
        if (from_ver + 1 < to_ver) {

            settings = MigrateSettings(from_ver, from_ver + 1, settings);
            return MigrateSettings(from_ver + 1, to_ver, settings);
        }
        
        return settings;

    }
};