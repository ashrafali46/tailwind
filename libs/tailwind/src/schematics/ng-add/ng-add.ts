import { chain, Rule } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import type {
  getWorkspace as getNxWorkspace,
  updateWorkspace as updateNxWorkspace,
} from '@nrwl/workspace';
import {
  addPackageJsonDependency,
  NodeDependency,
  NodeDependencyType,
} from '@schematics/angular/utility/dependencies';
import {
  getWorkspace,
  updateWorkspace,
} from '@schematics/angular/utility/workspace';
import { DEPENDENCIES } from '../../constants';
import {
  addConfigFiles,
  getLatestNodeVersion,
  updateProjectRootStyles,
  updateWorkspaceTargets,
} from '../../utils';
import type { TailwindSchematicsOptions } from '../schema';

export default function (options: TailwindSchematicsOptions): Rule {
  return (tree, context) => {
    return chain([
      addPackageJsonDependencies(options),
      installDependencies(),
      setupProject(options),
    ])(tree, context);
  };
}

function addPackageJsonDependencies(options: TailwindSchematicsOptions): Rule {
  const deps = [...DEPENDENCIES];

  if (options.style !== 'css') {
    deps.push(`postcss-${options.style}`);
  }

  return (tree, context) => {
    return Promise.all(
      deps.map((dep) =>
        getLatestNodeVersion(dep).then(({ name, version }) => {
          context.logger.info(`✅️ Added ${name}@${version}`);
          const nodeDependency: NodeDependency = {
            name,
            version,
            type: NodeDependencyType.Dev,
            overwrite: false,
          };
          addPackageJsonDependency(tree, nodeDependency);
        })
      )
    ).then(() => tree) as ReturnType<Rule>;
  };
}

function installDependencies(): Rule {
  return (tree, context) => {
    context.addTask(new NodePackageInstallTask());
    context.logger.info('✅️ Installed dependencies');
    return tree;
  };
}

function setupProject(options: TailwindSchematicsOptions): Rule {
  return chain([
    addConfigFiles(options.style),
    updateWorkspaceTargets(
      options.project,
      (updateWorkspace as unknown) as typeof updateNxWorkspace
    ),
    updateProjectRootStyles(
      options.project,
      (getWorkspace as unknown) as typeof getNxWorkspace
    ),
  ]);
}
