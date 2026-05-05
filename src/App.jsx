import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  BookOpen,
  Boxes,
  Crosshair,
  Database,
  Map,
  Shield,
  Sparkles,
  Swords,
  UserRound,
} from 'lucide-react';
import { CLASS_LINES, EDITIONS } from './data/classes.js';
import { PROFESSIONS } from './data/crafting.js';
import { SKILL_BUILDS } from './data/skills.js';
import { buildLowCostRoute, getMaterialValueIndex, getProfessionRecipes } from './engine/craftingEngine.js';
import { buildStatPlan } from './engine/levelEngine.js';
import { getMapRecommendations } from './engine/recommendationEngine.js';
import { probeOfficialData } from './engine/dataLoader.js';

const tabs = [
  { id: 'character', name: '角色模拟', icon: UserRound },
  { id: 'maps', name: '地图推荐', icon: Map },
  { id: 'skills', name: '技能表', icon: Swords },
  { id: 'crafting', name: '锻造系统', icon: Boxes },
  { id: 'data', name: '数据状态', icon: Database },
];

function App() {
  const [editionId, setEditionId] = useState('china');
  const [classId, setClassId] = useState('warrior');
  const [branchId, setBranchId] = useState('spearman');
  const [level, setLevel] = useState(35);
  const [professionId, setProfessionId] = useState('smithing');
  const [targetCraftLevel, setTargetCraftLevel] = useState(8);
  const [activeTab, setActiveTab] = useState('character');
  const [dataProbe, setDataProbe] = useState([]);

  const edition = EDITIONS.find((item) => item.id === editionId) ?? EDITIONS[0];
  const availableClasses = CLASS_LINES.filter((item) => edition.classIds.includes(item.id));
  const classLine = availableClasses.find((item) => item.id === classId) ?? availableClasses[0];
  const selectedBranch = classLine.branches.find((item) => item.id === branchId) ?? classLine.branches[0];
  const statPlan = useMemo(() => buildStatPlan(classLine, level), [classLine, level]);
  const recommendations = useMemo(
    () => getMapRecommendations({ classLine, level, statPlan }).slice(0, 5),
    [classLine, level, statPlan],
  );
  const skillRows = SKILL_BUILDS[selectedBranch?.id] ?? SKILL_BUILDS[classLine.id] ?? [];
  const professionRecipes = getProfessionRecipes(professionId);
  const materialValue = getMaterialValueIndex().slice(0, 8);
  const craftingRoute = buildLowCostRoute(professionId, targetCraftLevel);

  useEffect(() => {
    if (!classLine.branches.some((branch) => branch.id === branchId)) {
      setBranchId(classLine.branches[0]?.id);
    }
  }, [branchId, classLine]);

  useEffect(() => {
    probeOfficialData().then(setDataProbe);
  }, []);

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">MapleStory Classic World</p>
          <h1>MSCW Guidebook</h1>
          <p>
            一个把角色成长、命中门槛、地图路线、怪物属性、技能加点和六大锻造系统放在一起的交互式攻略宝典。
          </p>
          <div className="hero-actions">
            {EDITIONS.map((item) => (
              <button
                key={item.id}
                className={item.id === editionId ? 'pill active' : 'pill'}
                onClick={() => setEditionId(item.id)}
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>
        <CharacterCard classLine={classLine} branch={selectedBranch} statPlan={statPlan} level={level} />
      </section>

      <nav className="tab-bar" aria-label="Guidebook sections">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={activeTab === tab.id ? 'tab active' : 'tab'}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={18} />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </nav>

      {activeTab === 'character' && (
        <section className="grid two-col">
          <Panel title="角色与等级" icon={UserRound}>
            <div className="control-grid">
              <label>
                版本
                <select value={editionId} onChange={(event) => setEditionId(event.target.value)}>
                  {EDITIONS.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                一转职业
                <select value={classLine.id} onChange={(event) => setClassId(event.target.value)}>
                  {availableClasses.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                二转方向
                <select value={selectedBranch?.id} onChange={(event) => setBranchId(event.target.value)}>
                  {classLine.branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                等级：{level}
                <input
                  type="range"
                  min="1"
                  max="120"
                  value={level}
                  onChange={(event) => setLevel(Number(event.target.value))}
                />
              </label>
            </div>
            <div className="note-card">
              <strong>{selectedBranch?.name ?? classLine.name}</strong>
              <span>{selectedBranch?.theme ?? classLine.role}</span>
              <p>{classLine.hitFormulaNote}</p>
            </div>
          </Panel>

          <Panel title="属性计算" icon={BarChart3}>
            <div className="stat-grid">
              {Object.entries(statPlan.stats).map(([key, value]) => (
                <div className="stat-tile" key={key}>
                  <span>{key}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
            <div className="formula-row">
              <Metric label="总 AP" value={statPlan.totalAp} />
              <Metric label="总 SP" value={statPlan.totalSp} />
              <Metric label="物理命中" value={statPlan.derived.accuracy} />
              <Metric label="魔法命中" value={statPlan.derived.magicAccuracy} />
            </div>
          </Panel>
        </section>
      )}

      {activeTab === 'maps' && (
        <section className="grid one-col">
          <Panel title="推荐地图与怪物表" icon={Map}>
            <div className="map-list">
              {recommendations.map((map) => (
                <article className="map-card" key={map.id}>
                  <div className="map-card-head">
                    <div>
                      <p className="eyebrow">{map.region} · Lv.{map.levelRange[0]}-{map.levelRange[1]}</p>
                      <h3>{map.name}</h3>
                      <p>{map.routeNote}</p>
                    </div>
                    <div className="score-badge">{map.score}</div>
                  </div>
                  <div className="tag-row">
                    {map.tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                  <p className={map.canHitAll ? 'safe-text' : 'warn-text'}>
                    <Crosshair size={16} /> {map.warning}
                  </p>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>怪物</th>
                          <th>等级</th>
                          <th>HP</th>
                          <th>EXP</th>
                          <th>命中需求</th>
                          <th>防御</th>
                          <th>属性</th>
                        </tr>
                      </thead>
                      <tbody>
                        {map.monsters.map((monster) => (
                          <tr key={monster.id}>
                            <td>{monster.name}</td>
                            <td>{monster.level}</td>
                            <td>{monster.hp}</td>
                            <td>{monster.exp}</td>
                            <td>{monster.requiredAccuracy}</td>
                            <td>{monster.defense}</td>
                            <td>{formatElement(monster)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </article>
              ))}
            </div>
          </Panel>
        </section>
      )}

      {activeTab === 'skills' && (
        <section className="grid two-col">
          <Panel title="技能加点路线" icon={Swords}>
            <div className="timeline-list">
              {skillRows.map((row) => (
                <article className="timeline-item" key={`${row.level}-${row.priority}`}>
                  <span>{row.level}</span>
                  <h3>{row.priority}</h3>
                  <p>{row.note}</p>
                </article>
              ))}
            </div>
          </Panel>
          <Panel title="职业定位" icon={Shield}>
            <div className="feature-list">
              <Feature label="主属性" value={classLine.primaryStat} />
              <Feature label="副属性" value={classLine.secondaryStat} />
              <Feature label="武器" value={classLine.weaponTypes.join(' / ')} />
              <Feature label="定位" value={classLine.role} />
            </div>
          </Panel>
        </section>
      )}

      {activeTab === 'crafting' && (
        <section className="grid two-col wide-left">
          <Panel title="六大锻造系统" icon={Boxes}>
            <div className="profession-grid">
              {PROFESSIONS.map((profession) => (
                <button
                  key={profession.id}
                  className={professionId === profession.id ? 'profession-card active' : 'profession-card'}
                  onClick={() => setProfessionId(profession.id)}
                >
                  <span>{profession.icon}</span>
                  <strong>{profession.name}</strong>
                  <small>{profession.focus}</small>
                </button>
              ))}
            </div>
            <label className="target-control">
              目标专业等级：{targetCraftLevel}
              <input
                type="range"
                min="2"
                max="20"
                value={targetCraftLevel}
                onChange={(event) => setTargetCraftLevel(Number(event.target.value))}
              />
            </label>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>推荐阶段</th>
                    <th>配方</th>
                    <th>次数</th>
                    <th>金币</th>
                    <th>材料</th>
                  </tr>
                </thead>
                <tbody>
                  {craftingRoute.route.map((step) => (
                    <tr key={`${step.from}-${step.to}`}>
                      <td>{step.from} → {step.to}</td>
                      <td>{step.recipe}</td>
                      <td>{step.crafts}</td>
                      <td>{step.cost}</td>
                      <td>{step.materials.join('，')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
          <Panel title="材料价值指数" icon={Sparkles}>
            <div className="material-list">
              {materialValue.map((material) => (
                <article key={material.id} className="material-card">
                  <div>
                    <strong>{material.name}</strong>
                    <p>{material.source}</p>
                  </div>
                  <span>{material.score}</span>
                </article>
              ))}
            </div>
            <h3 className="section-mini-title">当前专业高效配方</h3>
            <div className="mini-list">
              {professionRecipes.map((recipe) => (
                <div key={recipe.id}>
                  <strong>{recipe.output}</strong>
                  <span>效率 {recipe.efficiency} · {recipe.materialNames.join('，')}</span>
                </div>
              ))}
            </div>
          </Panel>
        </section>
      )}

      {activeTab === 'data' && (
        <section className="grid two-col">
          <Panel title="官方数据接入状态" icon={Database}>
            <p className="panel-copy">
              当前版本先用 seed data 跑通交互。等你把 `AppData` 和 `RawData` 放到 `public/` 并 push 后，这里会显示可读取的数据入口。
            </p>
            <div className="mini-list">
              {dataProbe.map((item) => (
                <div key={item.path}>
                  <strong>{item.path}</strong>
                  <span>{item.found ? '已检测到' : `未检测到 / ${item.status}`}</span>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="下一步数据解析计划" icon={BookOpen}>
            <ol className="plan-list">
              <li>扫描 RawData 中怪物、地图、物品、技能、配方相关 JSON。</li>
              <li>写 converter，把官方字段转成本项目的 monsters/maps/recipes/skills schema。</li>
              <li>把经验、HP、防御、回避、属性抗性、掉落材料接入推荐引擎。</li>
              <li>接入角色 sprite/装备 sprite，替换当前剪影预览。</li>
            </ol>
          </Panel>
        </section>
      )}
    </main>
  );
}

function CharacterCard({ classLine, branch, statPlan, level }) {
  return (
    <aside className="character-card">
      <div className={`avatar-orb ${classLine.id}`}>
        <span>{classLine.name.slice(0, 1)}</span>
      </div>
      <div>
        <p className="eyebrow">Lv.{level} · {classLine.name}</p>
        <h2>{branch?.name ?? classLine.name}</h2>
        <p>{branch?.theme ?? classLine.role}</p>
      </div>
      <div className="formula-row compact">
        <Metric label="HP" value={statPlan.derived.hp} />
        <Metric label="MP" value={statPlan.derived.mp} />
        <Metric label="命中" value={statPlan.derived.accuracy} />
      </div>
    </aside>
  );
}

function Panel({ title, icon: Icon, children }) {
  return (
    <section className="panel">
      <header className="panel-header">
        <div>
          <Icon size={20} />
          <h2>{title}</h2>
        </div>
      </header>
      {children}
    </section>
  );
}

function Metric({ label, value }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Feature({ label, value }) {
  return (
    <div className="feature-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function formatElement(monster) {
  const weak = monster.elementWeakness.length ? `弱 ${monster.elementWeakness.join('/')}` : '无弱点';
  const resist = monster.elementResist.length ? `抗 ${monster.elementResist.join('/')}` : '无抗性';
  return `${weak}; ${resist}`;
}

export default App;
