/**
 * Data Loaders
 *
 * Provides a consistent interface for loading game data
 */

import { getAllActions, getActionById } from './repositories/actionRepository';
import { getAllAncestries, getAncestryById } from './repositories/ancestryRepository';
import { getAllBackgrounds, getBackgroundById } from './repositories/backgroundRepository';
import { getAllClasses, getClassById } from './repositories/classRepository';
import { getAllConditions, getConditionById } from './repositories/conditionRepository';
import { getAllEffects, getEffectById } from './repositories/effectRepository';
import { getAllEquipment, getEquipmentById } from './repositories/equipmentRepository';
import { getAllFeats, getFeatById } from './repositories/featRepository';
import { getAllHeritages, getHeritageById } from './repositories/heritageRepository';
import { getAllSpells, getSpellById } from './repositories/spellRepository';
import { journalLoader as journalLoaderInstance } from './loaders/journalLoader';

export const ancestryLoader = {
	loadAll: getAllAncestries,
	loadById: getAncestryById
};

export const backgroundLoader = {
	loadAll: getAllBackgrounds,
	loadById: getBackgroundById
};

export const classLoader = {
	loadAll: getAllClasses,
	loadById: getClassById
};

export const featLoader = {
	loadAll: getAllFeats,
	loadById: getFeatById
};

export const heritageLoader = {
	loadAll: getAllHeritages,
	loadById: getHeritageById
};

export const spellLoader = {
	loadAll: getAllSpells,
	loadById: getSpellById
};

export const equipmentLoader = {
	loadAll: getAllEquipment,
	loadById: getEquipmentById
};

export const actionLoader = {
	loadAll: getAllActions,
	loadById: getActionById
};

export const conditionLoader = {
	loadAll: getAllConditions,
	loadById: getConditionById
};

export const effectLoader = {
	loadAll: getAllEffects,
	loadById: getEffectById
};

export const journalLoader = journalLoaderInstance;
