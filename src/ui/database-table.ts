import type { PackageCheck, PackageState } from '../navdata/types.js';
import type { DatabaseFile, ScanResult } from '../shared/api.js';
import { isBusy, type RendererState, type ViewActions } from './state.js';

const statusLabels: Record<PackageState, string> = {
    installed: 'Installed',
    missing: 'Not fully installed',
    conflict: 'Conflicting data',
    unsupported: 'Not supported yet',
    error: 'Unable to check'
};
function cell(value: string, className: string): HTMLTableCellElement {
    const element = document.createElement('td');
    element.textContent = value;
    element.className = className;
    return element;
}

function packageCell(check: PackageCheck | undefined): HTMLTableCellElement {
    const element = cell('', 'package-cell');
    const badge = document.createElement('span');
    badge.className = 'package-state';
    badge.dataset.state = check?.state || 'error';
    badge.textContent = check ? statusLabels[check.state] : 'Not checked';
    const detail = document.createElement('p');
    detail.className = 'package-detail';
    detail.textContent = check?.message || 'Select a data package and rescan.';
    element.append(badge, detail);
    return element;
}

function actionCell(file: DatabaseFile, platform: ScanResult, check: PackageCheck | undefined, state: RendererState, actions: ViewActions): HTMLTableCellElement {
    const element = cell('', 'action-cell');
    if (check?.state !== 'missing') {
        element.textContent = check?.state === 'installed' ? 'Up to date' : '—';
        return element;
    }
    const button = document.createElement('button');
    button.className = 'insert-button';
    button.type = 'button';
    button.textContent = state.installingPath === file.path ? 'Inserting…' : 'Insert data';
    button.disabled = isBusy(state);
    button.setAttribute('aria-label', `Insert ${check.name} into ${file.name}`);
    button.addEventListener('click', () => actions.install({
        databasePath: file.path,
        packageId: check.packageId,
        platformId: platform.id
    }));
    element.appendChild(button);
    return element;
}

function databaseRow(file: DatabaseFile, platform: ScanResult, state: RendererState, actions: ViewActions): HTMLTableRowElement {
    const row = document.createElement('tr');
    const name = cell(file.name, 'filename-cell');
    name.title = file.path;
    const size = (file.size / (1024 * 1024)).toLocaleString(undefined, { maximumFractionDigits: 1 });
    const check = file.packages.find(check => check.packageId === state.packageId);
    row.append(cell(platform.name, 'system-cell'), name, cell(`${size} MB`, 'size-cell'), cell(new Date(file.modified).toLocaleString(), 'date-cell'), cell(file.header?.cycle || '—', 'cycle-cell'), cell(file.header?.effective || '—', 'effective-cell'), cell(file.header?.revision || '—', 'revision-cell'), packageCell(check), actionCell(file, platform, check, state, actions));
    return row;
}

export function renderDatabaseTable(table: HTMLElement, body: HTMLElement, state: RendererState, actions: ViewActions): void {
    const platform = state.results.find(result => result.id === state.platformId);
    table.hidden = state.scanning || !platform?.files.length;
    body.replaceChildren();
    if (state.scanning || !platform)
        return;
    body.append(...platform.files.map(file => databaseRow(file, platform, state, actions)));
}
