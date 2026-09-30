import { useMemo, useState } from "react";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  Banknote,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Coins,
  CreditCard,
  Download,
  History,
  Layers3,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import "./_group.css";
import { calcSystemBalance, fmt, formatDate, previewHistory, previewTransactions } from "./_shared/previewData";

const styles = `
.dh-page{--ink:#eef3ff;--muted:#8291ae;--line:rgba(130,158,211,.15);--panel:rgba(12,25,55,.78);position:relative;isolation:isolate;overflow:hidden;background:linear-gradient(137deg,#070e23 0%,#09152f 47%,#0a1027 100%);color:var(--ink);font-family:var(--font-sans)}
.dh-atmosphere{position:absolute;z-index:-1;inset:0;pointer-events:none;background:radial-gradient(ellipse at 13% 9%,rgba(30,93,177,.20),transparent 32%),radial-gradient(ellipse at 94% 28%,rgba(99,54,175,.16),transparent 28%),radial-gradient(ellipse at 58% 100%,rgba(19,72,142,.10),transparent 42%)}
.dh-page:before{content:"";position:fixed;z-index:8;inset:0;pointer-events:none;opacity:.11;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.14'/%3E%3C/svg%3E")}
.dh-header{position:relative;z-index:10;border-bottom:1px solid rgba(132,158,206,.12);background:rgba(7,15,36,.73);backdrop-filter:blur(22px)}
.dh-header-inner{max-width:1440px;margin:auto;padding:18px 32px;display:flex;align-items:center;justify-content:space-between;gap:24px}
.dh-heading-group{display:flex;align-items:center;gap:13px;min-width:0}
.dh-back-button,.dh-brand-mark{display:grid;place-items:center;flex:0 0 auto}
.dh-back-button{width:38px;height:38px;border-radius:13px;color:#9eacc8;border:1px solid rgba(150,174,219,.12);background:rgba(20,37,72,.62);transition:background .18s,color .18s,border-color .18s}
.dh-back-button:hover{color:#fff;background:rgba(61,96,157,.25);border-color:rgba(142,175,233,.3)}
.dh-brand-mark{width:38px;height:38px;border-radius:13px;color:#c2a6ff;background:linear-gradient(145deg,rgba(126,76,216,.32),rgba(72,48,140,.18));border:1px solid rgba(164,124,245,.22);box-shadow:inset 0 1px rgba(255,255,255,.08)}
.dh-heading-group h1{font-size:20px;line-height:1.15;font-weight:700;letter-spacing:-.035em;color:#f5f7ff}
.dh-heading-group p{margin-top:5px;color:#8190ac;font-size:11px;letter-spacing:.005em}
.dh-heading-group p span{color:#536584;padding:0 3px}
.dh-preview-tag{font-size:8px;font-weight:700;letter-spacing:.11em;color:#aab9d2;border:1px solid rgba(139,164,207,.2);background:rgba(85,112,160,.1);border-radius:5px;padding:4px 6px}
.dh-header-actions,.dh-range-control{display:flex;align-items:center;gap:9px}
.dh-header-actions{flex-shrink:0}
.dh-range-control{padding:5px;border:1px solid rgba(116,145,198,.19);background:rgba(9,20,46,.78);border-radius:12px;box-shadow:inset 0 1px rgba(255,255,255,.025)}
.dh-date-input{display:flex;align-items:center;gap:7px;color:#93a5c4;border-radius:8px;padding:0 8px}
.dh-date-input input{width:120px;color:#e3eaf8;font-size:11px;background:transparent;outline:none;min-width:0}
.dh-date-input input::-webkit-calendar-picker-indicator{opacity:.68;filter:invert(.82) sepia(.18) saturate(.55)}
.dh-range-to{color:#60708e;font-size:11px}
.dh-apply-button,.dh-export-button{display:flex;align-items:center;justify-content:center;gap:7px;height:33px;border-radius:9px;font-weight:600;font-size:11px;transition:filter .18s,background .18s,border-color .18s}
.dh-apply-button{padding:0 13px;color:#f8faff;background:linear-gradient(135deg,#526fea,#4859cb);border:1px solid rgba(151,166,255,.45);box-shadow:0 4px 14px rgba(52,76,190,.22)}
.dh-apply-button:hover{filter:brightness(1.13)}
.dh-export-wrap{position:relative}
.dh-export-button{padding:0 12px;color:#d5dff0;background:rgba(16,31,62,.77);border:1px solid rgba(124,154,209,.24)}
.dh-export-button:hover{background:rgba(38,57,96,.75);border-color:rgba(143,176,235,.4)}
.dh-export-menu{position:absolute;z-index:20;right:0;top:calc(100% + 8px);width:216px;padding:7px;border-radius:12px;background:#101d3a;border:1px solid rgba(132,161,215,.24);box-shadow:0 16px 42px rgba(0,0,0,.42)}
.dh-export-menu button{display:flex;width:100%;align-items:center;gap:9px;text-align:left;padding:10px;border-radius:8px;color:#e0e8f8;font-size:11px}
.dh-export-menu button:hover{background:rgba(115,144,201,.12)}
.dh-export-menu button span{margin-left:auto;color:#91a3c4;font-family:ui-monospace,monospace}
.dh-export-menu p{padding:2px 10px 6px;color:#7182a2;font-size:9px}
.dh-content{position:relative;max-width:1440px;margin:0 auto;padding:22px 32px 54px}
.dh-summary-panel{position:relative;display:grid;grid-template-columns:185px minmax(0,1fr);align-items:center;min-height:132px;padding:20px 23px;border:1px solid rgba(100,139,211,.21);border-radius:16px;overflow:hidden;background:linear-gradient(105deg,rgba(17,39,81,.94),rgba(11,29,64,.85) 50%,rgba(36,27,81,.79));box-shadow:0 16px 38px rgba(0,0,0,.18),inset 0 1px rgba(255,255,255,.045)}
.dh-summary-panel:after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(90deg,rgba(58,103,180,.08),transparent 28%,transparent 70%,rgba(123,73,197,.08))}
.dh-summary-intro{position:relative;z-index:1;padding-right:18px}
.dh-summary-kicker,.dh-eyebrow{display:block;color:#91a4c5;font-size:9px;font-weight:700;letter-spacing:.115em;text-transform:uppercase}
.dh-summary-intro h2{margin-top:7px;font-size:19px;font-weight:650;letter-spacing:-.03em;color:#f1f5ff}
.dh-summary-intro p{margin-top:4px;color:#8c9bbb;font-size:10px}
.dh-summary-metrics{position:relative;z-index:1;display:grid;grid-template-columns:repeat(4,minmax(0,1fr))}
.dh-summary-metric{display:flex;align-items:center;gap:12px;min-width:0;padding:8px 15px;border-left:1px solid rgba(142,167,210,.15)}
.dh-summary-icon{display:grid;place-items:center;flex:0 0 auto;width:39px;height:39px;border-radius:12px;color:#a9bcdf;background:rgba(104,143,205,.12);border:1px solid rgba(138,169,220,.15)}
.dh-summary-cash .dh-summary-icon{color:#53dfad;background:rgba(37,177,131,.12);border-color:rgba(64,221,168,.18)}
.dh-summary-banks .dh-summary-icon{color:#70a5ff;background:rgba(69,116,224,.15);border-color:rgba(106,155,255,.18)}
.dh-summary-aeps .dh-summary-icon{color:#c18aff;background:rgba(149,85,223,.15);border-color:rgba(187,127,255,.18)}
.dh-summary-metric .dh-eyebrow{font-size:9px;letter-spacing:.065em;color:#98a9c6;text-transform:none;font-weight:500}
.dh-summary-value{margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#f1f5ff;font-size:17px;font-weight:700;letter-spacing:-.025em;font-variant-numeric:tabular-nums}
.dh-summary-caption{margin-top:4px;color:#7688a9;font-size:9px;white-space:nowrap}
.dh-summary-cash .dh-summary-value{color:#7be8c2}.dh-summary-banks .dh-summary-value{color:#8db6ff}.dh-summary-aeps .dh-summary-value{color:#d2a4ff}
.dh-summary-orbit{position:absolute;right:-26px;bottom:-44px;color:rgba(191,147,255,.055);transform:rotate(-17deg)}
.dh-list-heading{display:flex;align-items:end;justify-content:space-between;gap:16px;margin:27px 2px 12px}
.dh-list-heading h2{color:#eef3ff;font-size:16px;font-weight:650;letter-spacing:-.02em}
.dh-list-heading p{margin-top:4px;color:#7f90af;font-size:10px}
.dh-count-pill{display:inline-flex;align-items:center;justify-content:center;min-width:22px;height:20px;padding:0 6px;border:1px solid rgba(129,157,209,.19);border-radius:7px;background:rgba(85,114,168,.13);color:#aec3e9;font-size:10px;font-weight:600}
.dh-sort-note{display:flex;align-items:center;gap:6px;color:#7587a8;font-size:10px;padding-bottom:2px}
.dh-record-list{display:flex;flex-direction:column;gap:9px}
.dh-record{overflow:hidden;border:1px solid rgba(105,137,191,.17);border-radius:14px;background:linear-gradient(105deg,rgba(14,29,59,.9),rgba(12,27,57,.84));box-shadow:0 7px 18px rgba(0,0,0,.10),inset 0 1px rgba(255,255,255,.025);transition:border-color .18s,background .18s,transform .18s}
.dh-record:hover{border-color:rgba(123,158,219,.36);background:linear-gradient(105deg,rgba(18,36,70,.95),rgba(15,31,65,.9));transform:translateY(-1px)}
.dh-record-expanded{border-color:rgba(192,153,79,.35);background:linear-gradient(105deg,rgba(17,34,68,.97),rgba(17,31,62,.94))}
.dh-record-main{display:grid;grid-template-columns:minmax(190px,1.3fr) minmax(122px,.85fr) minmax(360px,2.4fr) minmax(155px,1.05fr) 112px;align-items:center;gap:15px;padding:12px 15px}
.dh-date-block{display:flex;align-items:center;gap:11px;min-width:0}
.dh-calendar-mark{display:grid;place-items:center;flex:0 0 auto;width:34px;height:34px;border-radius:10px;background:rgba(80,118,180,.12);border:1px solid rgba(117,151,204,.17);color:#a8c0e8}
.dh-record-date{color:#eaf0fb;font-size:11px;font-weight:650;white-space:nowrap;letter-spacing:-.01em}
.dh-today{display:inline-flex;align-items:center;gap:5px;padding:3px 6px;border-radius:20px;color:#6fe0b4;background:rgba(39,178,126,.11);border:1px solid rgba(75,211,161,.2);font-size:8px;font-weight:650}
.dh-today span{width:5px;height:5px;background:#54d5a1;border-radius:50%;box-shadow:0 0 7px rgba(84,213,161,.35)}
.dh-time{display:flex;align-items:center;gap:5px;margin-top:6px;color:#8091af;font-size:9px}
.dh-column-label{display:block;color:#7d8eac;font-size:8px;font-weight:550;letter-spacing:.055em;text-transform:uppercase}
.dh-opening{padding-left:14px;border-left:1px solid rgba(133,157,197,.14)}
.dh-opening strong{display:block;margin-top:6px;color:#d9e2f1;font-size:11px;font-weight:600;font-variant-numeric:tabular-nums;white-space:nowrap}
.dh-subtotals{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}
.dh-subtotal{display:flex;align-items:center;gap:8px;min-width:0;min-height:43px;padding:7px 9px;border-radius:9px;border:1px solid rgba(125,155,198,.14);background:rgba(34,55,88,.34)}
.dh-subtotal-cash{color:#56dfad;background:linear-gradient(120deg,rgba(19,110,83,.22),rgba(13,56,56,.3));border-color:rgba(54,195,145,.2)}
.dh-subtotal-banks{color:#78a9ff;background:linear-gradient(120deg,rgba(37,81,168,.25),rgba(15,45,90,.3));border-color:rgba(83,137,237,.22)}
.dh-subtotal-aeps{color:#c18aff;background:linear-gradient(120deg,rgba(111,55,163,.23),rgba(61,32,104,.3));border-color:rgba(172,102,238,.21)}
.dh-subtotal strong{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#eaf0fc;font-size:10px;font-weight:650;font-variant-numeric:tabular-nums}
.dh-subtotal span{display:block;margin-top:3px;color:#8292ae;font-size:8px}
.dh-system{display:flex;align-items:center;gap:9px;min-width:0;padding:8px 10px;border-radius:10px;background:linear-gradient(120deg,rgba(112,81,28,.29),rgba(58,47,33,.39));border:1px solid rgba(220,181,95,.39);box-shadow:inset 0 1px rgba(255,238,191,.06),0 0 16px rgba(181,137,44,.055)}
.dh-system-icon{display:grid;place-items:center;flex:0 0 auto;width:29px;height:29px;border-radius:8px;color:#f3c85d;background:rgba(207,157,52,.15)}
.dh-system .dh-column-label{color:#baa979;font-size:7px}
.dh-system strong{display:block;margin-top:4px;color:#f1cb69;font-size:14px;font-weight:750;letter-spacing:-.02em;white-space:nowrap;font-variant-numeric:tabular-nums}
.dh-view-button{display:flex;align-items:center;justify-content:center;gap:5px;min-height:35px;padding:0 8px;border-radius:9px;color:#c4d2e9;background:rgba(21,39,71,.56);border:1px solid rgba(124,154,205,.17);font-size:9px;font-weight:600;white-space:nowrap;transition:background .18s,border-color .18s,color .18s}
.dh-view-button:hover{color:#fff;background:rgba(49,74,119,.48);border-color:rgba(149,180,234,.32)}
.dh-view-button svg{transition:transform .18s}
.dh-details{margin:0 15px 14px;padding:17px 18px 12px;border-top:1px solid rgba(141,161,198,.15);background:linear-gradient(115deg,rgba(7,17,38,.32),rgba(12,21,43,.12));animation:dh-reveal .22s ease-out}
.dh-details-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:13px}
.dh-details-top h3{margin-top:4px;color:#eaf0fb;font-size:14px;font-weight:650}
.dh-record-id{padding:5px 7px;border:1px solid rgba(126,151,193,.16);border-radius:6px;color:#7889a8;font-family:ui-monospace,monospace;font-size:8px;letter-spacing:.06em}
.dh-detail-grid{display:grid;grid-template-columns:1fr .8fr 1.1fr 1.2fr;gap:19px}
.dh-detail-heading{margin-bottom:8px;color:#a6b4cc;font-size:9px;font-weight:700;letter-spacing:.075em;text-transform:uppercase}
.dh-detail-line{display:flex;justify-content:space-between;gap:8px;padding:5px 7px;border-radius:6px;background:rgba(19,34,61,.56);color:#8999b5;font-size:9px}
.dh-detail-line strong{color:#d7e1f2;font-family:ui-monospace,monospace;font-size:9px;font-weight:500}
.dh-denominations{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px}
.dh-denomination{display:flex;flex-direction:column;align-items:center;gap:3px;padding:6px 2px;border-radius:7px;background:rgba(21,38,65,.58);border:1px solid rgba(120,146,187,.08)}
.dh-denomination span{color:#7d8da8;font-size:8px}
.dh-denomination strong{color:#e0e8f5;font-family:ui-monospace,monospace;font-size:9px;font-weight:600}
.dh-denomination small{color:#e7c66d;font-family:ui-monospace,monospace;font-size:8px}
.dh-coins{grid-column:span 3;flex-direction:row;justify-content:space-between;padding:7px 9px}
.dh-coins small{margin-left:auto}
.dh-transaction-count{color:#7384a2;font-size:8px}
.dh-transaction{display:flex;align-items:center;gap:7px;padding:7px 8px;border-radius:7px;background:rgba(19,34,61,.56);color:#a8b5cc;font-size:9px}
.dh-transaction strong{font-family:ui-monospace,monospace;font-size:9px;font-weight:600}
.dh-tx-totals{display:flex;justify-content:space-between;gap:8px;padding:6px 2px 0;color:#7d8eaa;font-size:8px}
.dh-tx-totals strong{margin-left:3px;color:#bfcee4;font-family:ui-monospace,monospace;font-weight:550}
.dh-no-transactions{padding:12px 9px;border:1px dashed rgba(119,145,187,.19);border-radius:8px;color:#798aa7;font-size:9px}
.dh-edit-row{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:13px;padding-top:11px;border-top:1px solid rgba(131,153,189,.1)}
.dh-edit-row p{color:#71829f;font-size:9px}
.dh-edit-button{display:flex;align-items:center;gap:6px;color:#dfc26e;font-size:9px;font-weight:600}
.dh-edit-button:hover{color:#ffe59a}
.dh-empty-state{display:flex;flex-direction:column;align-items:center;padding:48px 20px;text-align:center;border:1px solid rgba(109,142,194,.16);border-radius:15px;background:rgba(13,27,55,.55)}
.dh-empty-state>div{display:grid;place-items:center;width:48px;height:48px;border-radius:14px;color:#a4b9df;background:rgba(81,119,180,.13);border:1px solid rgba(122,156,214,.16)}
.dh-empty-state h3{margin-top:13px;color:#e6edf9;font-size:14px;font-weight:650}
.dh-empty-state p{margin-top:5px;color:#8494b1;font-size:10px}
.dh-empty-state button{display:flex;align-items:center;gap:7px;margin-top:17px;padding:8px 11px;border:1px solid rgba(117,152,209,.21);border-radius:8px;color:#c3d2eb;background:rgba(52,77,120,.23);font-size:10px}
.dh-empty-state button:hover{background:rgba(67,98,150,.34)}
.dh-notice{position:fixed;z-index:30;right:22px;bottom:20px;display:flex;align-items:center;gap:16px;max-width:min(440px,calc(100vw - 32px));padding:12px 13px 12px 15px;border:1px solid rgba(136,165,215,.24);border-radius:11px;background:rgba(17,32,60,.96);box-shadow:0 12px 34px rgba(0,0,0,.34);color:#dbe5f6;font-size:10px;backdrop-filter:blur(18px)}
.dh-notice button{display:grid;place-items:center;flex:0 0 auto;width:23px;height:23px;border-radius:6px;color:#93a5c2;background:rgba(127,151,191,.1)}
@keyframes dh-reveal{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
@media(max-width:1050px){.dh-header-inner{align-items:flex-start;flex-direction:column;padding:16px 22px;gap:15px}.dh-header-actions{width:100%;justify-content:space-between}.dh-content{padding:20px 22px 44px}.dh-summary-panel{grid-template-columns:150px minmax(0,1fr);padding:18px}.dh-summary-metric{padding:7px 10px;gap:9px}.dh-summary-icon{width:34px;height:34px}.dh-summary-value{font-size:14px}.dh-record-main{grid-template-columns:minmax(175px,1.2fr) minmax(115px,.8fr) minmax(300px,2fr) minmax(145px,1fr);gap:12px}.dh-view-button{grid-column:4;grid-row:2;justify-self:stretch}.dh-system{grid-column:4;grid-row:1}.dh-subtotals{grid-row:1 / span 2}.dh-date-block{grid-row:1}.dh-opening{grid-row:2}.dh-detail-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:700px){.dh-header-inner{padding:14px 15px}.dh-header-actions{align-items:stretch;flex-direction:column}.dh-range-control{justify-content:space-between;gap:4px}.dh-date-input{gap:4px;padding:0 4px}.dh-date-input input{width:min(31vw,130px);font-size:10px}.dh-apply-button{padding:0 9px}.dh-export-wrap{align-self:flex-end}.dh-content{padding:17px 14px 38px}.dh-summary-panel{display:block;padding:17px 15px}.dh-summary-intro{padding:0 0 13px}.dh-summary-intro h2{font-size:17px}.dh-summary-metrics{grid-template-columns:repeat(2,minmax(0,1fr));row-gap:12px}.dh-summary-metric{padding:5px 7px;border-left:0}.dh-summary-metric:nth-child(even){border-left:1px solid rgba(142,167,210,.15)}.dh-summary-value{font-size:14px}.dh-summary-caption{font-size:8px}.dh-list-heading{margin-top:23px}.dh-sort-note{font-size:9px}.dh-record-main{grid-template-columns:minmax(0,1fr) auto;gap:11px 10px;padding:13px}.dh-date-block{grid-column:1;grid-row:1}.dh-opening{grid-column:2;grid-row:1;text-align:right;padding-left:10px}.dh-opening strong{font-size:10px}.dh-subtotals{grid-column:1 / -1;grid-row:2;gap:6px}.dh-subtotal{min-height:46px;padding:7px 6px;gap:5px}.dh-subtotal svg{width:14px;height:14px}.dh-subtotal strong{font-size:9px}.dh-subtotal span{font-size:8px}.dh-system{grid-column:1;grid-row:3;padding:7px 9px}.dh-system strong{font-size:13px}.dh-view-button{grid-column:2;grid-row:3;min-width:104px}.dh-details{margin:0 12px 12px;padding:14px 2px 8px}.dh-detail-grid{grid-template-columns:1fr 1fr;gap:15px 12px}.dh-edit-row{align-items:flex-start;flex-direction:column}.dh-edit-button{align-self:flex-end}}
@media(max-width:390px){.dh-heading-group{gap:8px}.dh-back-button,.dh-brand-mark{width:34px;height:34px}.dh-heading-group h1{font-size:18px}.dh-preview-tag{font-size:7px}.dh-date-input input{width:27vw}.dh-apply-button{font-size:10px;gap:4px}.dh-subtotal{flex-direction:column;align-items:flex-start;padding:6px}.dh-system{gap:6px}.dh-system-icon{width:25px;height:25px}.dh-detail-grid{grid-template-columns:1fr}.dh-denominations{grid-template-columns:repeat(3,minmax(0,1fr))}}
`;

type Entry = (typeof previewHistory)[number];

const money = (amount: number) => `₹${fmt(amount)}`;

function localDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function timestampLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Time unavailable";
  return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function SummaryMetric({
  icon: Icon,
  label,
  value,
  caption,
  tone,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  caption: string;
  tone: "neutral" | "cash" | "banks" | "aeps";
}) {
  return (
    <div className={`dh-summary-metric dh-summary-${tone}`}>
      <div className="dh-summary-icon"><Icon size={19} strokeWidth={1.8} /></div>
      <div className="min-w-0">
        <p className="dh-eyebrow">{label}</p>
        <p className="dh-summary-value">{value}</p>
        <p className="dh-summary-caption">{caption}</p>
      </div>
    </div>
  );
}

function DetailGroup({ title, rows }: { title: string; rows: Array<[string, number]> }) {
  return (
    <section className="min-w-0">
      <h3 className="dh-detail-heading">{title}</h3>
      <div className="space-y-1.5">
        {rows.map(([label, value]) => (
          <div className="dh-detail-line" key={label}>
            <span>{label}</span><strong>{money(value)}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function HistoryRecord({
  entry,
  expanded,
  onToggle,
  onEdit,
}: {
  entry: Entry;
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
}) {
  const { cash, bank, aeps, total } = calcSystemBalance(entry);
  const isToday = entry.date === localDate(new Date());
  const transactions = previewTransactions.filter((transaction) => transaction.date === entry.date);
  const transactionIncome = transactions
    .filter((transaction) => transaction.type === "income")
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const transactionExpense = transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const subtotals = [
    { label: "Cash", amount: cash, icon: Wallet, tone: "cash" },
    { label: "Banks", amount: bank, icon: Layers3, tone: "banks" },
    { label: "AEPS", amount: aeps, icon: CreditCard, tone: "aeps" },
  ];

  return (
    <article className={`dh-record ${expanded ? "dh-record-expanded" : ""}`}>
      <div className="dh-record-main">
        <div className="dh-date-block">
          <div className="dh-calendar-mark"><CalendarDays size={18} /></div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="dh-record-date">{formatDate(entry.date)}</h2>
              {isToday && <span className="dh-today"><span />Today</span>}
            </div>
            <p className="dh-time"><Clock3 size={12} />{timestampLabel(entry.updatedAt)}</p>
          </div>
        </div>

        <div className="dh-opening">
          <span className="dh-column-label">Opening balance</span>
          <strong>{money(entry.openingBalance)}</strong>
        </div>

        <div className="dh-subtotals">
          {subtotals.map(({ label, amount, icon: Icon, tone }) => (
            <div className={`dh-subtotal dh-subtotal-${tone}`} key={label}>
              <Icon size={17} strokeWidth={1.9} />
              <div className="min-w-0">
                <strong>{money(amount)}</strong>
                <span>{label}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="dh-system">
          <div className="dh-system-icon"><Coins size={20} /></div>
          <div className="min-w-0">
            <span className="dh-column-label">System balance</span>
            <strong>{money(total)}</strong>
          </div>
        </div>

        <button type="button" className="dh-view-button" onClick={onToggle} aria-expanded={expanded}>
          <span>{expanded ? "Hide details" : "View details"}</span>
          <ChevronRight size={16} className={expanded ? "rotate-90" : ""} />
        </button>
      </div>

      {expanded && (
        <div className="dh-details">
          <div className="dh-details-top">
            <div>
              <p className="dh-eyebrow">Record detail</p>
              <h3>Balance composition</h3>
            </div>
            <span className="dh-record-id">RECORD #{entry.id}</span>
          </div>
          <div className="dh-detail-grid">
            <DetailGroup title="Bank accounts" rows={[
              ["BOB Saving", entry.bobSaving], ["BOB Current", entry.bobCurrent],
              ["HDFC", entry.hdfc], ["Kotak", entry.kotak], ["AU", entry.au], ["SBI", entry.sbi],
            ]} />
            <DetailGroup title="AEPS wallets" rows={[
              ["BOB", entry.aepsBob], ["Fino", entry.aepsFino],
              ["Payworld", entry.aepsPayworld], ["Digipay", entry.aepsDigipay],
            ]} />
            <section>
              <h3 className="dh-detail-heading">Cash denominations</h3>
              <div className="dh-denominations">
                {[
                  [500, entry.notes500], [200, entry.notes200], [100, entry.notes100],
                  [50, entry.notes50], [20, entry.notes20], [10, entry.notes10],
                ].map(([denomination, count]) => (
                  <div className="dh-denomination" key={denomination}>
                    <span>₹{denomination}</span>
                    <strong>×{count}</strong>
                    <small>{money(Number(denomination) * Number(count))}</small>
                  </div>
                ))}
                <div className="dh-denomination dh-coins">
                  <span>Coins</span><strong>—</strong><small>{money(entry.coins)}</small>
                </div>
              </div>
            </section>
            <section className="dh-transactions">
              <div className="flex items-center justify-between gap-3">
                <h3 className="dh-detail-heading">Transactions</h3>
                <span className="dh-transaction-count">{transactions.length} records</span>
              </div>
              {transactions.length ? (
                <div className="space-y-1.5">
                  {transactions.map((transaction) => (
                    <div className="dh-transaction" key={transaction.id}>
                      {transaction.type === "income"
                        ? <TrendingUp size={14} className="text-emerald-300" />
                        : <TrendingDown size={14} className="text-rose-300" />}
                      <span className="min-w-0 flex-1 truncate">{transaction.note || transaction.type}</span>
                      <strong className={transaction.type === "income" ? "text-emerald-300" : "text-rose-300"}>
                        {transaction.type === "income" ? "+" : "−"}{money(transaction.amount)}
                      </strong>
                    </div>
                  ))}
                  <div className="dh-tx-totals">
                    <span>Income <strong>{money(transactionIncome)}</strong></span>
                    <span>Expense <strong>{money(transactionExpense)}</strong></span>
                  </div>
                </div>
              ) : (
                <p className="dh-no-transactions">No transactions recorded for this day.</p>
              )}
            </section>
          </div>
          <div className="dh-edit-row">
            <p>Figures reflect the saved record for {formatDate(entry.date)}.</p>
            <button type="button" className="dh-edit-button" onClick={onEdit}>Open &amp; edit entry <ArrowRight size={14} /></button>
          </div>
        </div>
      )}
    </article>
  );
}

export function ReferenceRedesign() {
  const dates = previewHistory.map((entry) => entry.date).sort();
  const firstDate = dates[0] ?? "";
  const lastDate = dates[dates.length - 1] ?? "";
  const [startDraft, setStartDraft] = useState(firstDate);
  const [endDraft, setEndDraft] = useState(lastDate);
  const [appliedRange, setAppliedRange] = useState({ start: firstDate, end: lastDate });
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [notice, setNotice] = useState("");

  const filteredHistory = useMemo(
    () => previewHistory.filter((entry) => entry.date >= appliedRange.start && entry.date <= appliedRange.end),
    [appliedRange],
  );
  const totals = filteredHistory.reduce(
    (sum, entry) => {
      const balance = calcSystemBalance(entry);
      sum.cash += balance.cash;
      sum.bank += balance.bank;
      sum.aeps += balance.aeps;
      return sum;
    },
    { cash: 0, bank: 0, aeps: 0 },
  );

  const applyRange = () => {
    if (startDraft && endDraft && startDraft > endDraft) {
      setNotice("Choose a start date on or before the end date.");
      return;
    }
    setAppliedRange({ start: startDraft, end: endDraft });
    setExpandedId(null);
    setNotice("");
  };

  const exportCsv = () => {
    const headings = ["Date", "Updated at", "Opening balance", "Cash", "Banks", "AEPS", "System balance"];
    const rows = filteredHistory.map((entry) => {
      const { cash, bank, aeps, total } = calcSystemBalance(entry);
      return [entry.date, entry.updatedAt, entry.openingBalance, cash, bank, aeps, total];
    });
    const csv = [headings, ...rows].map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `dailyamount-history-${appliedRange.start || "all"}-to-${appliedRange.end || "all"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setExportOpen(false);
    setNotice(`Exported ${filteredHistory.length} filtered ${filteredHistory.length === 1 ? "record" : "records"} to CSV.`);
  };

  return (
    <div className="daily-history-preview dh-page min-h-[100dvh]">
      <style>{styles}</style>
      <div className="dh-atmosphere" aria-hidden="true" />
      <header className="dh-header">
        <div className="dh-header-inner">
          <div className="dh-heading-group">
            <button
              type="button"
              aria-label="Back to reconciliation"
              className="dh-back-button"
              onClick={() => setNotice("This is an isolated preview; back navigation is disabled.")}
            >
              <ArrowLeft size={18} />
            </button>
            <div className="dh-brand-mark"><History size={19} /></div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1>History</h1>
                <span className="dh-preview-tag">SANDBOX PREVIEW</span>
              </div>
              <p>{previewHistory.length} entries <span>·</span> Daily system balance history</p>
            </div>
          </div>

          <div className="dh-header-actions">
            <div className="dh-range-control">
              <label className="dh-date-input">
                <CalendarDays size={15} />
                <span className="sr-only">Start date</span>
                <input type="date" value={startDraft} onChange={(event) => setStartDraft(event.target.value)} />
              </label>
              <span className="dh-range-to">to</span>
              <label className="dh-date-input">
                <span className="sr-only">End date</span>
                <input type="date" value={endDraft} onChange={(event) => setEndDraft(event.target.value)} />
              </label>
              <button type="button" className="dh-apply-button" onClick={applyRange}><Check size={14} />Apply</button>
            </div>
            <div className="dh-export-wrap">
              <button
                type="button"
                className="dh-export-button"
                aria-expanded={exportOpen}
                onClick={() => setExportOpen((open) => !open)}
              >
                <ArrowDownToLine size={15} />Export<ChevronDown size={14} />
              </button>
              {exportOpen && (
                <div className="dh-export-menu">
                  <button type="button" onClick={exportCsv}><Download size={15} />Download CSV <span>{filteredHistory.length}</span></button>
                  <p>Only currently applied records</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="dh-content">
        <section className="dh-summary-panel" aria-label="History summary">
          <div className="dh-summary-intro">
            <span className="dh-summary-kicker">RECONCILIATION OVERVIEW</span>
            <h2>At a glance</h2>
            <p>Balances across your daily records</p>
          </div>
          <div className="dh-summary-metrics">
            <SummaryMetric icon={Layers3} label="Total entries" value={String(filteredHistory.length)} caption="In applied date range" tone="neutral" />
            <SummaryMetric icon={Wallet} label="Total cash" value={money(totals.cash)} caption="Across filtered records" tone="cash" />
            <SummaryMetric icon={Banknote} label="Total banks" value={money(totals.bank)} caption="Across filtered records" tone="banks" />
            <SummaryMetric icon={CreditCard} label="Total AEPS" value={money(totals.aeps)} caption="Across filtered records" tone="aeps" />
          </div>
          <div className="dh-summary-orbit" aria-hidden="true"><CircleDollarSign size={112} strokeWidth={0.65} /></div>
        </section>

        <div className="dh-list-heading">
          <div>
            <div className="flex items-center gap-2">
              <h2>Daily records</h2>
              <span className="dh-count-pill">{filteredHistory.length}</span>
            </div>
            <p>The source record behind every balance</p>
          </div>
          <div className="dh-sort-note"><CalendarDays size={14} />Newest first</div>
        </div>

        {filteredHistory.length > 0 ? (
          <div className="dh-record-list">
            {filteredHistory.map((entry) => (
              <HistoryRecord
                key={entry.id}
                entry={entry}
                expanded={expandedId === entry.id}
                onToggle={() => setExpandedId((current) => current === entry.id ? null : entry.id)}
                onEdit={() => setNotice("Editing is available in the live application.")}
              />
            ))}
          </div>
        ) : (
          <section className="dh-empty-state">
            <div><CalendarDays size={23} /></div>
            <h3>No records in this range</h3>
            <p>Adjust your dates and apply again to see matching history.</p>
            <button type="button" onClick={() => { setStartDraft(firstDate); setEndDraft(lastDate); setAppliedRange({ start: firstDate, end: lastDate }); }}>
              Reset date range <ArrowRight size={14} />
            </button>
          </section>
        )}
      </main>

      {notice && (
        <div className="dh-notice" role="status">
          <span>{notice}</span>
          <button type="button" aria-label="Dismiss message" onClick={() => setNotice("")}><X size={15} /></button>
        </div>
      )}
    </div>
  );
}