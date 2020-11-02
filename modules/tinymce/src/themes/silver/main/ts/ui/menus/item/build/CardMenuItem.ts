/**
 * Copyright (c) Tiny Technologies, Inc. All rights reserved.
 * Licensed under the LGPL or a commercial license.
 * For LGPL see License.txt in the project root for license information.
 * For commercial licenses see https://www.tiny.cloud/
 */

import { AlloyComponent, AlloySpec, Behaviour, Disabling } from '@ephox/alloy';
import { Menu } from '@ephox/bridge';
import { Arr, Optional } from '@ephox/katamari';
import { Selectors } from '@ephox/sugar';
import { UiFactoryBackstageShared } from 'tinymce/themes/silver/backstage/Backstage';
import { renderItemDomStructure } from 'tinymce/themes/silver/ui/menus/item/structure/ItemStructure';
import ItemResponse from '../ItemResponse';
import { renderContainer, renderHtml, renderImage } from '../structure/ItemSlices';
import { replaceText } from './AutocompleteMenuItem';
import { buildData, renderCommonItem } from './CommonMenuItem';

export interface CardExtras {
  itemBehaviours?: Array<Behaviour.NamedConfiguredBehaviour<Behaviour.BehaviourConfigSpec, Behaviour.BehaviourConfigDetail>>;
  // Extras specific to title components
  title: {
    matchText?: string;
    highlight: string[];
  };
}

const render = (items: Menu.CardItem[], extras: CardExtras): Array<AlloySpec> => Arr.map(items, (item) => {
  switch (item.type) {
    case 'cardcontainer':
      return renderContainer(render(item.items, extras), item.direction);

    case 'cardimage':
      return renderImage(item.src, item.classes, item.alt);

    case 'cardtext':
      // Only highlight targeted text components
      const shouldHighlight = item.name.exists((name) => Arr.contains(extras.title.highlight, name));
      const matchText = shouldHighlight ? Optional.from(extras.title.matchText).getOr('') : '';
      return renderHtml(replaceText(item.text, matchText), item.classes);
  }
});

export const renderCardMenuItem = (
  spec: Menu.CardMenuItem,
  itemResponse: ItemResponse,
  sharedBackstage: UiFactoryBackstageShared,
  extras: CardExtras
) => {
  const getApi = (component: AlloyComponent): Menu.CardMenuItemInstanceApi => ({
    isDisabled: () => Disabling.isDisabled(component),
    setDisabled: (state: boolean) => {
      Disabling.set(component, state);

      // Disable sub components
      Selectors.all('*', component.element).forEach((elm) => {
        component.getSystem().getByDom(elm).each((comp: AlloyComponent) => {
          if (comp.hasConfigured(Disabling)) {
            Disabling.set(comp, state);
          }
        });
      });
    }
  });

  const structure = {
    dom: renderItemDomStructure(false, spec.label),
    optComponents: Arr.map(render(spec.items, extras), Optional.some)
  };

  return renderCommonItem({
    data: buildData({ text: Optional.none(), ...spec }),
    disabled: spec.disabled,
    getApi,
    onAction: spec.onAction,
    onSetup: spec.onSetup,
    triggersSubmenu: false,
    itemBehaviours: Optional.from(extras.itemBehaviours).getOr([])
  }, structure, itemResponse, sharedBackstage.providers);
};