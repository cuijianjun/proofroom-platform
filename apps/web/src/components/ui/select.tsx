'use client';

import {Children,isValidElement,useCallback,useEffect,useId,useLayoutEffect,useRef,useState,type ChangeEvent,type ComponentProps,type KeyboardEvent,type ReactNode} from 'react';
import {Icon} from './icons';
import {useMobileProductLayout,useProductExperience} from './product-experience';

type Props=Omit<ComponentProps<'select'>,'multiple'|'size'|'value'|'defaultValue'|'ref'>&{value?:string|number;defaultValue?:string|number;'data-field-path'?:string};
type Choice={value:string;label:string;disabled:boolean};
function text(node:ReactNode):string{return Children.toArray(node).map(child=>isValidElement<{children?:ReactNode}>(child)?text(child.props.children):String(child)).join('');}
function options(children:ReactNode,inheritedDisabled=false):Choice[]{return Children.toArray(children).flatMap(child=>{
 if(!isValidElement<{value?:string|number;label?:string;children?:ReactNode;disabled?:boolean}>(child))return [];
 if(child.type==='option'){const label=child.props.label??text(child.props.children);return [{value:String(child.props.value??label),label,disabled:inheritedDisabled||!!child.props.disabled}];}
 return options(child.props.children,inheritedDisabled||!!child.props.disabled);
});}

/** The native element carries form values/validation only; users operate the site listbox. */
export function Select({children,className,id,value,defaultValue,onChange,onInvalid,disabled,required,'aria-label':ariaLabel,'aria-labelledby':ariaLabelledBy,'aria-describedby':description,'aria-invalid':externalInvalid,'data-field-path':fieldPath,...nativeProps}:Props){
 const product=useProductExperience(),mobile=useMobileProductLayout();
 const uid=useId(),triggerId=id??`${uid}-control`,listId=`${uid}-list`,choices=options(children),optionCount=choices.length,controlled=value!==undefined;
 const initial=String(defaultValue??choices[0]?.value??'');
 const [local,setLocal]=useState(initial),[open,setOpen]=useState(false),[active,setActive]=useState(0),[error,setError]=useState(''),[placement,setPlacement]=useState<{left:number;top?:number;bottom?:number;width:number;maxHeight:number}>({left:0,top:0,width:220,maxHeight:320});
 const root=useRef<HTMLDivElement>(null),trigger=useRef<HTMLButtonElement>(null),native=useRef<HTMLSelectElement>(null),list=useRef<HTMLDivElement>(null),typed=useRef({text:'',at:0});
 useLayoutEffect(()=>{if(!product)return;const media=matchMedia('(max-width:767px)'),update=()=>{if(list.current){setOpen(false);trigger.current?.focus({preventScroll:true});}};media.addEventListener('change',update);return()=>media.removeEventListener('change',update);},[product]);
 const current=controlled?String(value):local,selected=choices.findIndex(c=>c.value===current),firstEnabled=choices.findIndex(c=>!c.disabled);
 const highlighted=choices[active]&&!choices[active].disabled?active:selected>=0&&!choices[selected].disabled?selected:firstEnabled;
 const label=selected>=0?choices[selected].label:current?'选项已变化，请重新选择':choices.length?'请选择':'暂无可选项';
 const issue=selected<0&&current?'选项已变化，请重新选择':required&&!current?'请选择一项':selected>=0&&choices[selected].disabled?'此选项暂不可用，请重新选择':'';
 const measure=useCallback(()=>{
  const button=trigger.current;if(!button)return false;const rect=button.getBoundingClientRect();
  if(mobile)return true;
  if(rect.bottom<=0||rect.top>=innerHeight){setOpen(false);return false;}
  const width=Math.min(Math.max(rect.width,220),innerWidth-24),below=innerHeight-rect.bottom-20,above=rect.top-20;
  const down=below>=Math.min(264,optionCount*44)||below>=above,maxHeight=Math.max(44,Math.min(320,down?below:above));
  setPlacement({left:Math.max(12,Math.min(rect.left,innerWidth-width-12)),top:down?rect.bottom+6:undefined,bottom:down?undefined:innerHeight-rect.top+6,width,maxHeight});return true;
 },[optionCount,setOpen,setPlacement,mobile]);
 useEffect(()=>{if(!open||!mobile)return;const old=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.body.style.overflow=old;};},[open,mobile]);
 useEffect(()=>{if(!open||!mobile)return;const element=native.current;if(!element)return;const fields:Element[]=[element];for(let parent=element.parentElement;parent;parent=parent.parentElement)if(parent instanceof HTMLFieldSetElement)fields.push(parent);const check=()=>{if(!element.isConnected||!element.matches(':disabled'))return;setOpen(false);const heading=trigger.current?.closest('section')?.querySelector<HTMLElement>('h1,h2')??document.querySelector<HTMLElement>('#main');if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}};const observer=new MutationObserver(check);fields.forEach(field=>observer.observe(field,{attributes:true,attributeFilter:['disabled']}));queueMicrotask(check);return()=>observer.disconnect();},[open,mobile]);

 useLayoutEffect(()=>{native.current?.setCustomValidity(issue);},[issue]);
 useLayoutEffect(()=>{if(open)list.current?.querySelector<HTMLElement>(`[data-index="${highlighted}"]`)?.scrollIntoView({block:'nearest'});},[open,highlighted]);
 useEffect(()=>{const element=native.current,form=element?.form;if(!element)return;if(!controlled)for(const option of element.options){if(option.value===initial)option.setAttribute('selected','');else option.removeAttribute('selected');}if(!form)return;const reset=()=>{if(!controlled)setLocal(initial);setError('');setOpen(false);};form.addEventListener('reset',reset);return()=>form.removeEventListener('reset',reset);},[controlled,initial,nativeProps.form]);
 useEffect(()=>{
  if(!open)return;
  const outside=(event:PointerEvent)=>{if(!root.current?.contains(event.target as Node))setOpen(false);};
  const scroll=(event:Event)=>{if(!list.current?.contains(event.target as Node))measure();};
  const resize=()=>measure();
  document.addEventListener('pointerdown',outside);window.addEventListener('scroll',scroll,true);window.addEventListener('resize',resize);
  return()=>{document.removeEventListener('pointerdown',outside);window.removeEventListener('scroll',scroll,true);window.removeEventListener('resize',resize);};
 },[open,measure]);
 function show(index=selected>=0&&!choices[selected].disabled?selected:firstEnabled){
  const button=trigger.current;if(!button||button.matches(':disabled'))return;
  if(measure()){setActive(index);setOpen(true);}
 }
 function choose(index:number){
  const option=choices[index],element=native.current;if(!option||option.disabled||!element||element.matches(':disabled')){setOpen(false);return;}
  element.value=option.value;element.dispatchEvent(new Event('change',{bubbles:true}));setOpen(false);trigger.current?.focus();
 }
 function change(event:ChangeEvent<HTMLSelectElement>){if(!controlled)setLocal(event.target.value);setError('');onChange?.(event);}
 function move(delta:number){let index=highlighted;for(let n=0;n<choices.length;n++){index=(index+delta+choices.length)%choices.length;if(!choices[index].disabled){setActive(index);return;}}}
 function key(event:KeyboardEvent<HTMLButtonElement>){
  if(trigger.current?.matches(':disabled'))return;
  if(event.key==='Escape'&&open){event.preventDefault();event.stopPropagation();setOpen(false);return;}
  if(event.key==='Tab'){setOpen(false);return;}
  if(event.key==='Enter'||event.key===' '){event.preventDefault();if(open)choose(highlighted);else show();return;}
  if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();if(!open)show();else move(event.key==='ArrowDown'?1:-1);return;}
  if(event.key==='Home'||event.key==='End'){event.preventDefault();const index=event.key==='Home'?firstEnabled:choices.findLastIndex(c=>!c.disabled);if(open)setActive(index);else show(index);return;}
  if(event.key.length===1&&!event.ctrlKey&&!event.metaKey&&!event.altKey){
   event.preventDefault();const now=event.timeStamp,previous=typed.current;const term=now-previous.at<650?previous.text+event.key:event.key;typed.current={text:term.toLocaleLowerCase(),at:now};
   const from=open?highlighted:selected;for(let n=1;n<=choices.length;n++){const index=(from+n+choices.length)%choices.length;if(!choices[index].disabled&&choices[index].label.toLocaleLowerCase().startsWith(typed.current.text)){if(open)setActive(index);else show(index);break;}}
  }
 }
 function cancel(){setOpen(false);trigger.current?.focus({preventScroll:true});}
 const optionNodes=<>{choices.map((option,index)=><button type="button" role="option" tabIndex={-1} key={`${option.value}:${index}`} id={`${uid}-option-${index}`} data-value={option.value} data-index={index} data-active={highlighted===index||undefined} aria-selected={option.value===current} aria-disabled={option.disabled||undefined} disabled={option.disabled} className="select-option" onMouseDown={event=>event.preventDefault()} onPointerMove={()=>{if(!option.disabled)setActive(index);}} onClick={()=>choose(index)}><span>{option.label}</span>{option.value===current&&<Icon.Check size={17}/>}</button>)}{!choices.length&&<p className="select-empty">暂无可选项</p>}</>;
 return <div className="site-select" ref={root}>
  <select {...nativeProps} ref={native} hidden aria-hidden="true" tabIndex={-1} disabled={disabled} required={required} value={current} onChange={change} onInvalid={event=>{event.preventDefault();setError(issue||'请选择一个可用选项');trigger.current?.focus();onInvalid?.(event);}}>
   {selected<0&&current&&<option value={current} disabled hidden>{label}</option>}{children}
  </select>
  <button ref={trigger} id={triggerId} type="button" role="combobox" className={['select','select-trigger',className].filter(Boolean).join(' ')} disabled={disabled} aria-label={ariaLabel} aria-labelledby={ariaLabelledBy} aria-describedby={[description,error?`${uid}-error`:undefined].filter(Boolean).join(' ')||undefined} aria-invalid={!!error||externalInvalid||undefined} aria-required={required||undefined} aria-expanded={open} aria-controls={listId} aria-haspopup="listbox" aria-activedescendant={open&&highlighted>=0?`${uid}-option-${highlighted}`:undefined} data-value={current} data-field-path={fieldPath} onKeyDown={key} onClick={()=>open?setOpen(false):show()}>
   <span className="select-value">{label}</span><Icon.ChevronDown className="select-chevron" size={17}/>
  </button>
  {open&&(mobile?<><button type="button" className="mobile-select-backdrop" aria-label="取消选择" tabIndex={-1} onClick={cancel}/><div className="mobile-select-sheet"><div className="mobile-select-toolbar"><span>请选择</span><button type="button" onClick={cancel}>取消</button></div><div ref={list} id={listId} role="listbox" aria-labelledby={triggerId} className="select-listbox">{optionNodes}</div></div></>:<div ref={list} id={listId} role="listbox" aria-labelledby={triggerId} className="select-listbox" style={placement}>{optionNodes}</div>)}
  {error&&<p className="field-error" id={`${uid}-error`} role="alert">{error}</p>}
 </div>;
}
