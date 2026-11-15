import {expect,type Locator} from '@playwright/test';

// Choose through the visible product control, including inside a native dialog.
export async function chooseOption(control:Locator,choice:string|{label?:string;value?:string;index?:number}){
 const closed=control.locator('xpath=ancestor::details[not(@open)]');while(await closed.count())await closed.first().locator(':scope > summary').click();
 await expect(control).toBeEnabled();await control.click();
 const id=await control.getAttribute('aria-controls');expect(id).toBeTruthy();
 const list=control.page().locator(`[role="listbox"][id=${JSON.stringify(id)}]`);await expect(list).toBeVisible();
 const options=list.getByRole('option');
 const rows=await options.evaluateAll(elements=>elements.map(e=>({value:e.getAttribute('data-value'),label:e.textContent?.trim(),disabled:e.getAttribute('aria-disabled')==='true'})));
 const index=typeof choice==='object'&&choice.index!==undefined?choice.index:rows.findIndex(row=>typeof choice==='string'?row.value===choice:choice.value!==undefined?row.value===choice.value:row.label===choice.label);
 expect(index,'the requested visible option exists').toBeGreaterThanOrEqual(0);expect(rows[index]?.disabled).toBe(false);
 await options.nth(index).click();await expect(control).toHaveAttribute('aria-expanded','false');
}

// Dates and time cards are selected through the same visible steps as a customer.
export async function chooseSlot(group:Locator,choice:string|{index:number}){
 const closed=group.locator('xpath=ancestor::details[not(@open)]');while(await closed.count())await closed.first().locator(':scope > summary').click();
 await expect(group).toBeVisible();const sheet=group.page().getByRole('dialog',{name:'选择预约时段',exact:true});if(!await sheet.isVisible())await group.locator('.slot-trigger').click();
 const buttons=sheet.locator('button[data-slot-value]'),rows=await buttons.evaluateAll(elements=>elements.map(e=>({value:e.getAttribute('data-slot-value')!,disabled:(e as HTMLButtonElement).disabled})));
 const choices=[...rows.filter(r=>r.value===''),...rows.filter(r=>r.value!==''&&!r.disabled)],value=typeof choice==='string'?rows.find(r=>r.value===choice||choice!==''&&r.value.split(':')[0]===choice)?.value:choices[choice.index]?.value;
 expect(value,'the requested appointment is present').toBeDefined();const item=sheet.locator(`button[data-slot-value=${JSON.stringify(value)}]`);if(value){const day=await item.getAttribute('data-slot-day');await sheet.locator(`button[data-date=${JSON.stringify(day)}]`).click();}await expect(item).toBeEnabled();await item.click();await expect(item).toHaveAttribute('aria-pressed','true');await sheet.getByRole('button',{name:'确认选择',exact:true}).click();await expect(sheet).not.toBeVisible();await expect(group).toHaveAttribute('data-selected-slot',value!);
}
