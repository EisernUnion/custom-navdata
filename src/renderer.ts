import { NavDataController } from './ui/controller.js';
import { createNavDataView } from './ui/view.js';

document.addEventListener('DOMContentLoaded', () => {
    const controller = new NavDataController(window.navdata, createNavDataView());
    void controller.initialize();
});
