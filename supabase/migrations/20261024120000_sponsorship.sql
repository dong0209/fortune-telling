-- 方案改為贊助名義：贊助 NT$899 協助測試付費版、贊助 NT$2,399 協助測試 VIP 版
update public.plans set name = '付費版測試贊助', price = 899,
  description = '協助測試付費版：完整八字、紫微斗數、星盤，36 個月時機曲線、offer 比較與現職適配'
where id = 'paid';
update public.plans set name = 'VIP 版測試贊助', price = 2399,
  description = '協助測試 VIP 版：付費版全部內容，加上奇門遁甲、人類圖、主管／同事合盤'
where id = 'vip';
