import { NamedPage } from 'vj/misc/Page';
import { tpl } from 'vj/utils';

const contestTimer = $(tpl`<pre class="contest-timer" style="display:none"></pre>`);
contestTimer.appendTo(document.body);

export default new NamedPage(['contest_detail', 'contest_problemlist', 'contest_detail_problem', 'contest_scoreboard'], () => {});
