/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Event } from '../../../../base/common/event.js';
import { InstantiationType, registerSingleton } from '../../../../platform/instantiation/common/extensions.js';
import { IOnboardingService } from '../common/onboardingService.js';

/**
 * KunCode keeps the standard Welcome editor and intentionally omits the
 * upstream Copilot sign-in onboarding dialog.
 */
class KunCodeOnboardingService implements IOnboardingService {
	declare readonly _serviceBrand: undefined;
	readonly onDidDismiss = Event.None;
	show(): void { }
}

registerSingleton(IOnboardingService, KunCodeOnboardingService, InstantiationType.Delayed);
