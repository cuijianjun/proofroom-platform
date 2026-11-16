"use client";

import { Icon } from "@/components/ui/icons";
import { useRef } from "react";

/**
 * 搜索框：放大镜按钮在输入框内左侧，点它、按回车或手机键盘上的搜索键都能提交，
 * 因此不再需要在框下面单独摆一个「搜索」按钮。
 * 必须放在 form 里（type=submit 依赖 form 的 onSubmit）。
 * 输入法组词时的回车是上词，不能当成提交。
 */
export function SearchBox({
  id,
  label,
  value,
  onChange,
  placeholder,
  maxLength,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  maxLength?: number;
}) {
  const composing = useRef(false);
  return (
    <div className="search-box">
      <button type="submit" className="search-box-submit" aria-label="提交搜索">
        <Icon.Search size={17} />
      </button>
      <input
        id={id}
        className="input search-box-input"
        type="search"
        enterKeyHint="search"
        aria-label={label}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onCompositionStart={() => {
          composing.current = true;
        }}
        onCompositionEnd={() => {
          composing.current = false;
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && composing.current) e.preventDefault();
        }}
      />
    </div>
  );
}
