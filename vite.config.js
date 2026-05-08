import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function mscwAlgorithmPatch() {
  return {
    name: 'mscw-algorithm-patch',
    enforce: 'pre',
    transform(code, id) {
      const cleanId = id.split('?')[0].replace(/\\/g, '/');
      let next = code;

      if (cleanId.endsWith('/src/App.jsx')) {
        next = next.replace(
          "import { getMapRecommendations } from './engine/recommendationEngine.js';",
          "import { getMapRecommendations } from './engine/recommendationEngineV3.js';\nimport { buildRecommendedGearV2 } from './engine/gearRecommendationEngine.js';",
        );

        next = next.replace(
          'const statPlan = useMemo(() => buildStatPlan(classLine, level), [classLine, level]);',
          "const statPlan = useMemo(() => buildStatPlan(classLine, level, { budget }), [classLine, level, budget]);",
        );

        next = next.replace(
          `() => getMapRecommendations({\n      classLine,\n      level,\n      statPlan,\n      maps: officialData?.maps,\n      monsters: officialData?.monsters,\n    }).slice(0, 8),\n    [classLine, level, statPlan, officialData],`,
          `() => getMapRecommendations({\n      classLine,\n      branch: selectedBranch,\n      level,\n      statPlan,\n      budget,\n      priority,\n      mode,\n      maps: officialData?.maps,\n      monsters: officialData?.monsters,\n    }).slice(0, 8),\n    [classLine, selectedBranch, level, statPlan, budget, priority, mode, officialData],`,
        );

        next = next.replace(
          'const recommendedGear = buildRecommendedGear(classLine, level, budget, officialData?.items, professionRecipes);',
          'const recommendedGear = buildRecommendedGearV2(classLine, level, budget, officialData?.items, professionRecipes);',
        );

        return next === code ? null : { code: next, map: null };
      }

      if (cleanId.endsWith('/src/AppMediaEnhanced.jsx')) {
        next = next.replace(
          "const next = { tab, editionId, classId, branchId, gender, level, budget, priority, apAllocation, skillAllocation, gearOverrides };",
          `const dashboardSnapshot = {\n      editionId,\n      classId,\n      branchId,\n      gender,\n      level,\n      budget,\n      priority,\n      minLevel,\n      maxLevel,\n      className: classLine?.name,\n      branchName: branch?.name,\n      gear,\n      weapon,\n      stats,\n      bestMap,\n      bestMonster,\n      skillPlan: {\n        damageCards: skillPlan?.damageCards ?? [],\n        skills: skillPlan?.skills ?? [],\n        totalSp: skillPlan?.totalSp ?? 0,\n        totalSpByTier: skillPlan?.totalSpByTier ?? {},\n      },\n    };\n    const next = { tab, editionId, classId, branchId, gender, level, budget, priority, apAllocation, skillAllocation, gearOverrides, dashboardSnapshot };`,
        );

        next = next.replace(
          '[tab, editionId, classId, branchId, gender, level, budget, priority, apAllocation, skillAllocation, gearOverrides]);',
          '[tab, editionId, classId, branchId, gender, level, budget, priority, apAllocation, skillAllocation, gearOverrides, classLine, branch, minLevel, maxLevel, gear, weapon, stats, bestMap, bestMonster, skillPlan]);',
        );

        return next === code ? null : { code: next, map: null };
      }

      if (cleanId.endsWith('/src/components/CommunityBuildsPage.jsx')) {
        next = next.replace(
          "import { fetchCommunityBuild, fetchCommunityBuilds, submitCommunityBuild } from '../services/buildApi.js';\nimport '../styles/community-builds.css';",
          "import { fetchCommunityBuild, fetchCommunityBuilds, submitCommunityBuild } from '../services/buildApi.js';\nimport BuildSnapshotDashboard from './BuildSnapshotDashboard.jsx';\nimport '../styles/community-builds.css';",
        );

        next = next.replace(
          'maps: {},',
          'maps: { dashboardSnapshot: savedState.dashboardSnapshot ?? null },',
        );

        next = next.replace(
          'return <main className="community-builds-shell">\n    <header className="community-builds-hero">',
          'return <main className="community-builds-shell">\n    {!buildId && <header className="community-builds-hero">',
        );

        next = next.replace(
          '    </header>\n\n    {buildId ? <BuildDetail buildId={buildId} /> : <BuildLibrary />}',
          '    </header>}\n\n    {buildId ? <BuildDetail buildId={buildId} /> : <BuildLibrary />}',
        );

        next = next.replace(
          '  return <section className="community-panel detail-panel">',
          `  const dashboardSnapshot = build.maps?.dashboardSnapshot;\n\n  if (dashboardSnapshot) {\n    return <BuildSnapshotDashboard snapshot={dashboardSnapshot} build={build} copied={copied} onBack={() => navigateTo('/builds')} onCopy={handleCopy} />;\n  }\n\n  return <section className="community-panel detail-panel">`,
        );

        return next === code ? null : { code: next, map: null };
      }

      return null;
    },
  };
}

export default defineConfig({
  plugins: [mscwAlgorithmPatch(), react()],
  base: process.env.GITHUB_ACTIONS ? '/mscw-guidebook/' : '/',
});
