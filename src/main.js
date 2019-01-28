import Vue from 'vue';
import App from './App.vue';
import vueCustomElement from 'vue-custom-element';
import './css/main.scss'
import BootstrapVue from 'bootstrap-vue';
// for old(er) browsers. custom polyfill in order for your HTML custom element to work.
import 'document-register-element/build/document-register-element';

Vue.use(BootstrapVue);
Vue.use(vueCustomElement)

Vue.config.productionTip = false

Vue.customElement('gsheet-vue-widget', App)