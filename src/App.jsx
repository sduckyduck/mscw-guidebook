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
import { loadOfficialGuideData } from './engine/officialDataAdapter.js';

const tabs = [
  { id: 'character', name: '角色模拟', icon: UserRound },
  { id: 'maps', name: '地图推荐', icon: Map },
  { id: 'skills', name: '技能表', icon: Swords },
  { id: 'crafting', name: '锻造系统', icon: Boxes },
  { id: 'data', name: '数据状态', icon: Database },
];

const professionIconMap = Object.fromEntries(PROFESSIONS.map((profession) => [profession.id, profession]));

function App() {
  const [editionId, setEditionId] = useState('china');
  const [classId, setClassId] = useState('warrior');
  const [branchId, setBranchId] = useState('spearman');
  const [level, setLevel] = useState(35);
  const [professionId, setProfessionId] = useState('smithing');
  const [targetCraftLevel, setTargetCraftLevel] = useState(8);
  const [activeTab, setActiveTab] = useState('character');
  const [dataProbe, setDataProbe] = useState([]);
  const [officialData, setOfficialData] = useState(null);
  const [officialError, setOfficialError] = useState('');

  const edition = EDITIONS.find((item) => item.id === editionId) ?? EDITIONS[0];
  const availableClasses = CLASS_LINES.filter((item) => edition.classIds.includes(item.id));
  const classLine = availableClasses.find((item) => item.id === classId) ?? availableClasses[0];
  const selectedBranch = classLine.branches.find((item) => item.id === branchId) ?? classLine.branches[0];
  const statPlan = useMemo(() => buildStatPlan(classLine, level), [classLine, level]);
  const recommendations = useMemo(
    () => getMapRecommendations({
      classLine,
      level,
      statPlan,
      maps: officialData?.maps,
      monsters: officialData?.monsters,
    }).slice(0, 5),
    [classLine, level, statPlan, officialData],
  );
  const skillRows = SKILL_BUILDS[selectedBranch?.id] ?? SKILL_BUILDS[classLine.id] ?? [];
  const professions = useMemo(() => buildProfessionList(officialData), [officialData]);
  const activeProfessionId = professions.some((profession) => profession.id === professionId)
    ? professionId
    : professions[0]?.id ?? 'smithing';
  const recipes = officialData?.recipes;
  const materials = officialData?.materials;
  const professionRecipes = getProfessionRecipes(activeProfessionId, recipes, materials);
  const materialValue = getMaterialValueIndex(recipes, materials).slice(0, 8);
  const craftingRoute = buildLowCostRoute(activeProfessionId, targetCraftLevel, recipes, materials);

  useEffect(() => {
    if (!classLine.branches.some((branch) => branch.id === branchId)) {
      setBranchId(classLine.branches[0]?.id);
    }
  }, [branchId, classLine]);

  useEffect(() => {
    probeOfficialData().then(setDataProbe);
    loadOfficialGuideData()
      .then((data) => {
        setOfficialData(data);
        setOfficialError('');
      })
      .catch((error) => {
        setOfficialError(error.message || '官方数据读取失败');
      });
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
            <span className={officialData ? 'data-badge ok' : 'data-badge'}>
              {officialData ? `官方数据已接入：${officialData.overview?.monsters ?? officialData.monsters.length} 怪物 / ${officialData.maps.length} 刷图地图` : '正在读取官方数据'}
            </span>
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
            <p className="panel-copy">
              {officialData
                ? '当前推荐已使用 public/AppData/monsters.json 和 maps.json。评分综合等级差、命中压力、怪物密度和职业适配。'
                : '当前使用示例数据；官方数据读取完成后会自动切换。'}
            </p>
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
                  {map.thumbnail && <img className="map-thumb" src={map.thumbnail} alt={`${map.name} minimap`} />}
                  <div className="tag-row">
                    {map.tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                    {Number.isFinite(map.spawnTotal) && <span>刷怪数 {map.spawnTotal}</span>}
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
                          <th>攻击</th>
                          <th>属性</th>
                        </tr>
                      </thead>
                      <tbody>
                        {map.monsters.map((monster) => (
                          <tr key={`${map.id}-${monster.id}`}>
                            <td>
                              <div className="monster-cell">
                                {(monster.gif || monster.thumbnail) && (
                                  <img
                                    src={monster.gif || monster.thumbnail}
                                    alt=""
                                    onError={(event) => { event.currentTarget.style.display = 'none'; }}
                                  />
                                )}
                                <span>{monster.name}</span>
                              </div>
                            </td>
                            <td>{monster.level}</td>
                            <td>{monster.hp}</td>
                            <td>{monster.exp}</td>
                            <td>{monster.requiredAccuracy}</td>
                            <td>{monster.defense}</td>
                            <td>{monster.physicalAttack ?? '-'}</td>
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
            <p className="panel-copy">
              {officialData
                ? `当前锻造模块已读取官方 ${officialData.recipes.length} 条配方，并按金币/经验效率做低成本路线。`
                : '当前使用示例配方；官方 crafting.json 读取完成后会自动切换。'}
            </p>
            <div className="profession-grid">
              {professions.map((profession) => (
                <button
                  key={profession.id}
                  className={activeProfessionId === profession.id ? 'profession-card active' : 'profession-card'}
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
                      <td>{step.cost.toLocaleString()}</td>
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
                    <p>{material.source} · 覆盖 {material.recipeCount} 配方 · 总需求 {material.totalDemand}</p>
                  </div>
                  <span>{material.score}</span>
                </article>
              ))}
            </div>
            <h3 className="section-mini-title">当前专业高效配方</h3>
            <div className="mini-list">
              {professionRecipes.slice(0, 10).map((recipe) => (
                <div key={recipe.id}>
                  <strong>{recipe.output}</strong>
                  <span>Lv.{recipe.level} · 效率 {recipe.efficiency} · {recipe.materialNames.join('，')}</span>
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
              {officialData
                ? '官方 AppData 已经成功接入。地图推荐和锻造系统现在优先使用 public/AppData 下的数据。'
                : '正在检测 public/AppData 和 public/RawData。'}
            </p>
            {officialError && <p className="warn-text">{officialError}</p>}
            {officialData?.overview && (
              <div className="stat-grid data-stats">
                <Metric label="怪物" value={officialData.overview.monsters} />
                <Metric label="地图" value={officialData.overview.maps} />
                <Metric label="配方" value={officialData.overview.recipes} />
                <Metric label="技能" value={officialData.overview.skills} />
                <Metric label="装备" value={officialData.overview.equipment} />
                <Metric label="专业" value={officialData.overview.num_disciplines} />
              </div>
            )}
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
              <li>把角色 sprite / 装备 sprite 接到角色预览框。</li>
              <li>把 `skills.json` 转成每个职业的技能树和推荐加点表。</li>
              <li>把 `items.json` 接入装备池，计算不同等级的武器/装备推荐。</li>
              <li>把怪物掉落材料接到锻造系统，做刷怪囤货路线。</li>
            </ol>
          </Panel>
        </section>
      )}
    </main>
  );
}

function buildProfessionList(officialData) {
  if (!officialData?.professions?.length) return PROFESSIONS;

  return officialData.professions.map((profession) => {
    const local = professionIconMap[profession.id];
    return {
      id: profession.id,
      name: local?.name ?? profession.name,
      icon: local?.icon ?? '🔧',
      focus: local?.focus ?? `Skill ID ${profession.skillId}`,
    };
  });
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
  const weak = monster.elementWeakness?.length ? `弱 ${monster.elementWeakness.join('/')}` : '无弱点';
  const resist = monster.elementResist?.length ? `抗 ${monster.elementResist.join('/')}` : '无抗性';
  const special = monster.undead ? '不死系' : '';
  return [weak, resist, special].filter(Boolean).join('; ');
}

export default App;
