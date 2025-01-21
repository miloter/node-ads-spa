<script setup>
/**
 * TableXp: Componente Vue para tablas, permite:
 * ordenar, filtro simple y avanzado, selección múltiple
 * contenido extra, personalización del contenido
 * selección de columnas visibles y más.
 * Optimizado para velocidad.
 *
 * @author miloter
 * @since 2024-05-11
 * @version 2025-01-20
 *
 * Ordenación y filtrado: se realiza únicamente en las filas que pertenecen
 * al cuerpo de la tabla, excluyendo la fila de cabecera y las del pie.
 * Ordenación: el primer click ordena ascendentemente, el segundo descendentemente y el
 * tercero restaura el estado original, el ciclo se repite en el mismo orden.
 * Filtrado: no se distingue entre mayúscuas y minúsculas ni los
 * caracteres acentuados o con signos diacríticos. Si marcamos el check de
 * expresiones regulares se habilita dicho sistema de búsqueda.
 *
 * props:
 *      headers: array de objetos con los nombres de las cabeceras y las claves.
 *      El formato será {
 *          title: '...',
 *          key: '...',
 *          showFilter: true|[false],
 *          checked: [true]|false
 *      }, donde title es el título descriptivo de la cabecera, key el nombre de
 *      la clave en el objeto de la fila, showFilter indica si se mostrará o no
 *      un campo de filtrado y checked si la columna aparecerá inicialmente.
 *      El array headers puede ser de carga asíncrona.
 *  
 *      rows: array de objetos con los datos de las filas. Puede ser
 *      de carga asíncrona.
 *
 *      rowsPerPage: Número de filas que se mostrarán en cada página
 *      por defecto serán 10.
 *
 *      rowsSelectPage: Array de número de filas por página, por
 *      defecto es [2, 5, 10, 20, 50].
 *
 *      columnsMultiselect: booleano que indica si se muestra o no
 *      un cuadro de selección de columnas visibles, por defecto es true.
 * 
 *      csvExport: booleano que indica si se muestra o no un botón
 *      de exportación a archivo CSV, por defecto es true.
 *
 *      controlsPagination: booleano que indica si se muestran o no
 *      los controles de paginación, por defecto es true.
 * 
 *      multiselect: booleano que indica si se muestra o no una casilla de
 *      selección en la primera columna. Si es true, cada vez que cambie el
 *      estado de selección se emitirá el evento selectedChanged(selectedRows).
 * emits:
 *      filterChanged(currentRows): Cuando se produce un cambio en la ordenación o
 *      filtrado de las filas, recibe como argumento las filas filtradas.
 *  
 *      paginatedChanged(paginatedRows): Cuando cambia la página visualizada
 *      el argumento son las filas visibles.
 *
 *      selectedChanged(selectedRows): cuando se produce un cambio en las filas
 *      seleccionadas, el argumento son las filas seleccionadas.
 * 
 *      selectedColumnsChanged(selectedColumns): Se produce cuando cambian las
 *      columnas seleccionadas.
  * 
 *      expandChanged(isOpened, row): Si se implementa el slot #extra, se emitirá
 *      dicho evento con un indicador truthy de expandido y la fila afectada por
 *      la expasión/contracción de la fila.
 */
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import TestSearch from "./requirements/test-search.js";

const props = defineProps({
    headers: Array,
    rows: Array,
    rowsPerPage: { type: Number, default: 10 },
    rowsSelectPage: { type: Array, default: () => [2, 5, 10, 20, 50] },
    columnsMultiselect: { type: Boolean, default: true },    
    csvExport: { type: Boolean, default: true },
    controlsPagination: { type: Boolean, default: true },
    multiselect: { type: Boolean, default: false }
});
const emit = defineEmits(['filterChanged', 'paginatedChanged',
    'selectedChanged', 'selectedColumnsChanged', 'expandChanged']);

const hFilter = ref([]);
const currentRows = ref([]);
const unorderedRows = ref([]);
const asc = ref(undefined);
const currentPage = ref(1);
const numPages = ref(undefined);
const paginated = ref([]);
// Prop derivada mutable
const currentRowsPerPage = ref(props.rowsPerPage);
const selectedRows = ref([]);
const columnsSelectDisplayed = ref(false);
const filterSelected = ref(false);
// Símbolos del componente
const symRowExpand = Symbol('Indica si la fila extra está expandida');
const symRowChecked = Symbol('Indica si la fila está seleccionada');

function selectedColumnsChanged(value, col) {
    if (col) {
        col.checked = value;
    } else {
        for (const col of props.headers) {
            col.checked = value;
        }
    }
    updateHeaderFilters();
    emit('selectedColumnsChanged', filteredSelectedColumns.value);
}

function clickOutside(e) {
    if (!columnsSelectDisplayed.value) return;

    // Comprueba que no exista en ningún elemento contenedor la clase <instanceUid>    
    let el = e.target;
    let exists = false;
    while (el !== null) {
        if (el.classList.contains(instanceUid.value)) {
            exists = true;
            break;
        }
        el = el.parentElement;
    }

    if (!exists) {
        columnsSelectDisplayed.value = false;
    }
}

function expandChanged(row) {
    row[symRowExpand] = !row[symRowExpand];
    emit('expandChanged', row[symRowExpand], row);
}

function changeChecked(value, row) {
    if (row) {
        row[symRowChecked] = value;
        if (value) {
            selectedRows.value.push(row);
        } else {
            selectedRows.value = selectedRows.value.filter(r => r !== row);
        }
    } else {
        for (const row of currentRows.value) {
            row[symRowChecked] = value;
        }
        selectedRows.value = value ? currentRows.value : [];
    }
    emit('selectedChanged', selectedRows.value);
}

function sortOrFilter(isSort = false, key = undefined) {
    if (isSort) {
        if (asc.value !== false) {
            // Comprobamos si debemos hacer una copia
            if (asc.value === undefined) {
                unorderedRows.value = [...currentRows.value];
                currentRows.value.sort(comparer(key));
            }
            asc.value = !asc.value;
            if (!asc.value) {
                currentRows.value.reverse();
            }
        } else {
            currentRows.value = unorderedRows.value;
            unorderedRows.value = [];
            asc.value = undefined;
        }
    } else {
        asc.value = undefined;
        unorderedRows.value = [];

        // Comprueba solo los filtros con contenido
        const filterKeys = [];
        for (const f of hFilter.value) {
            if (!f.text) continue;
            const filter = normalize(f.text);
            filterKeys.push({
                filter,
                key: f.key
            });
        }

        // Agrega solo las filas que pasen los filtros de texto
        if (filterKeys.length) {
            currentRows.value = [];
            for (const row of props.rows) {
                let add = true;
                for (let i = 0; i < filterKeys.length; i++) {
                    const match = testSearch.value.eval(String(row[filterKeys[i].key]), filterKeys[i].filter);
                    if (!match) {
                        add = false;
                        break;
                    }
                }

                if (filterSelected.value) {
                    add = row[symRowChecked];
                }

                if (add) {
                    currentRows.value.push(row);
                }
            }
        } else {
            if (filterSelected.value) {
                currentRows.value = selectedRows.value;
            } else {
                currentRows.value = props.rows;
            }
        }
    }

    setNumPages();
    emit('filterChanged', currentRows.value);
}

/**
 * El comparador, usa una expresión regular para verificar si el valor de
 * la celda es una fecha, en cuyo caso se usa un comparador personalizado.
 * @param {string} key Clave del campo de ordenación.
 * @returns
 */
function comparer(key) {
    return function (a, b) {
        const valA = a[key], valB = b[key];

        if (isDateString(valA) && isDateString(valB)) {
            return compareDate(valA, valB);
        }

        if (isNumeric(valA) && isNumeric(valB)) {
            return Math.sign(valA - valB);
        } else {
            return valA.localeCompare(valB);
        }
    }
}

function isDateString(date) {
    return /^\d{2}(?:\/|-)\d{2}(?:\/|-)\d{4}$/.test(date);
}

function isNumeric(expr) {
    if (typeof (expr) === 'number' || typeof (expr) === 'bigint') {
        return true;
    } else if (typeof (expr) === 'string') {
        return /^\s*[+-]?\d+(?:\.\d+)?(?:[Ee][+-]?\d+)?\s*$/.test(expr);
    } else {
        return false;
    }
}

/**
 * Compara dos fechas en formato dd/mm/aaaa o dd-mm-aaaa.    
 * @param {string} valA Fecha en formato dd/mm/aaaa o dd-mm-aaaa.
 * @param {string} valB Fecha en formato dd/mm/aaaa o dd-mm-aaaa.
 * @returns
 */
function compareDate(valA, valB) {
    const dateA = new Date(valA.replace(reGroupedDateString, "$2/$1/$3"));
    const dateB = new Date(valB.replace(reGroupedDateString, "$2/$1/$3"));

    return dateA > dateB ? 1 : -1;
}

/**
 * Normaliza una cadena quitando los signos diacríticos y convirtiéndola a minúsculas.
 * @param {string} text Cadena que se normalizará.
 * @returns {string} Cadena normalizada.
 */
function normalize(text) {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function setNumPages() {
    numPages.value = Math.ceil(currentRows.value.length / currentRowsPerPage.value);
    currentPage.value = 1;
    showCurrentPage();
}

function prevPage() {
    if (currentPage.value === 1) return;
    currentPage.value--;
    showCurrentPage();
}

function nextPage() {
    if (currentPage.value === numPages.value) return;
    currentPage.value++;
    showCurrentPage();
}

function currentPageEnter() {
    if (currentPage.value < 1 || currentPage.value > numPages.value) return;
    showCurrentPage();
}

// Muestra la página actual
function showCurrentPage() {
    // Calculamos el paginado
    const start = (currentPage.value - 1) * currentRowsPerPage.value;
    paginated.value = currentRows.value.slice(start, start + currentRowsPerPage.value);
    emit('paginatedChanged', paginated.value);
}

function downloadCsv() {
    downloadFileCSV('datos.csv', getRowsToCsv());
}

// Descarga un fichero simulando un click
function downloadFileCSV(filename, content) {
    /* Se le agrega el BOM U+FEFF que indica
    condificación UTF-16 Big-Endian, y es requerido para
    que  Excel lo interprete correctamente */
    content = '\ufeff' + content;

    // Lo inyecta en un Blob
    const blob = new Blob([content], { type: '' });

    // Utiliza la técnica de la descarga al hacer click
    const el = document.createElement('a');
    el.href = URL.createObjectURL(blob);
    el.download = filename;
    document.body.appendChild(el);
    el.click();
    // Se borra el elemento creado
    document.body.removeChild(el);
}

// Devuelve la filas en una cadena con formato CSV        
function getRowsToCsv() {
    // Generamos la cadena en formato CSV            
    const sb = [];

    // Trabajaremos con las cabeceras
    const hs = props.headers.filter(h => h.checked);

    // Cabeceras del CSV            
    for (let i = 0; i < hs.length; i++) {
        sb.push('\"');
        sb.push(hs[i].title.replaceAll("\"", "\"\""));
        sb.push('\"');
        if (i < (hs.length - 1)) {
            sb.push(';');
        }
    }
    sb.push('\n');

    // Cuerpo del CSV            
    for (const r of currentRows.value) {
        for (let i = 0; i < hs.length; i++) {
            sb.push('\"');
            sb.push(String(r[hs[i].key] ?? '').replace("\"", "\"\""));
            sb.push('\"');
            if (i < (hs.length - 1)) {
                sb.push(';');
            }
        }
        sb.push('\n');
    }

    return sb.join('');
}

function updateHeaderFilters() {
    hFilter.value = [];
    for (const h of props.headers.filter(h => h.checked)) {
        hFilter.value.push({
            text: '',
            key: h.key
        });
    }
}

function change() {
    updateHeaderFilters();
    currentRows.value = props.rows;
    emit('filterChanged', currentRows.value);
    setNumPages();
    sortOrFilter();
}

/**
 * Las columnas que tienen el atributo checked a true o las que no
 * lo tienen se muestran inicialmente visibles
 */
function updateHeadersChecked() {
    for (const col of props.headers) {
        if (!('checked' in col)) {
            col.checked = true;
        }
    }
    updateHeaderFilters();
    emit('selectedColumnsChanged', filteredSelectedColumns.value);
}

const filteredSelectedColumns = computed(() => props.headers.filter(h => h.checked));

/**
 * Devuelve un ID de instancia del componente único.
 */
const instanceUid = computed(() => {
    return crypto.randomUUID();
});

const selectedRowsEqualsRows = computed(() => {
    if (selectedRows.value.length < currentRows.value.length) return false;

    // Solo es necesario verificar los de la página actual
    for (const p of paginated.value) {
        let match = false;
        for (const s of selectedRows.value) {
            if (s === p) {
                match = true;
                break;
            }
        }
        if (!match) {
            return false;
        }
    }

    return true;
});

const reDateString = computed(() => {
    return /^\d{2}(?:\/|-)\d{2}(?:\/|-)\d{4}$/;
});

const reGroupedDateString = computed(() => {
    return /^(\d{2})(?:\/|-)(\d{2})(?:\/|-)(\d{4})$/;
});

const sortTitle = computed(() => {
    return 'Ordena de forma ascendente o descendente, según el tipo de dato de la columna';
});

const filterTitle = computed(() => {
    return 'Permite filtrar por el texto introducido, no se distiguen mayúsculas de minúsculas ni letras acentuadas o no';
});

const testSearch = computed(() => {
    return new TestSearch();
});

/**
 * Es necesario escuchar para recalcular las filas visibles
 * debido a que las filas podrían cargarse de forma asíncrona.        
 */
watch(() => props.rows.length, () => {
    change()
});

/**
 * Si las cabeceras cambian dinámicamente, marca
 * como visibles todas las columnas.
 */
watch(() => props.headers.length, () => updateHeadersChecked());

// Si cambia el filtro de selección
watch(() => filterSelected, () => sortOrFilter());

onMounted(() => {
    document.addEventListener('click', clickOutside);
});

onUnmounted(() => {
    document.removeEventListener('click', clickOutside);
});

// Actualiza la propiedad de selección de cada columna
updateHeadersChecked();
// Fuerza la actualización de todos los elementos    
change();
</script>

<template>
    <div>
        <div class="top-controls">
            <div>{{ currentRows.length }} filas de {{ rows.length }}</div>
            <a v-if="csvExport" href="#" @click="downloadCsv"
                title="Exporta el filtrado actual a un archivo CSV">CSV</a>
            <div v-if="columnsMultiselect" class="columns-multiselect" :class="instanceUid"
                @keyup.esc="columnsSelectDisplayed = false">
                <button type="button" @click="columnsSelectDisplayed = !columnsSelectDisplayed">
                    Mostrar/ocultar columnas
                </button>
                <div v-show="columnsSelectDisplayed" class="columns-multiselect-checkboxes">
                    <label class="columns-multiselect-label-main">
                        <input type="checkbox" :checked="filteredSelectedColumns.length === headers.length"
                            @click="selectedColumnsChanged($event.target.checked, null)">
                        - Todas Visibles -
                    </label><br>
                    <template v-for="col in headers" :key="col.key">
                        <label>
                            <input type="checkbox" :checked="col.checked"
                                @click="selectedColumnsChanged($event.target.checked, col)">
                            {{ col.title }}
                        </label><br>
                    </template>
                </div>
            </div>
            <slot name="customControls"></slot>
        </div>
        <table class="table">
            <thead>
                <tr>
                    <th v-if="multiselect">
                        <input type="checkbox" :checked="selectedRowsEqualsRows"
                            @click="changeChecked($event.target.checked, null)">
                        <button type="button" title="Solo seleccionado" @click="filterSelected = !filterSelected"
                            :class="{ 'filter-selected': filterSelected }">
                            &#x2611;
                        </button>
                    </th>
                    <th v-if="$slots.extra">&nbsp;</th>
                    <th v-for="(h, idx) of filteredSelectedColumns" :key="idx">
                        <div v-if="h.showFilter" class="filter-controls">
                            <span :title="sortTitle" class="sort" @click="sortOrFilter(true, h.key)">&udarr;</span>
                            <input type="text" class="input-filter" :title="filterTitle"
                                v-model.trim="hFilter[idx].text" @keyup="sortOrFilter(false, h.key)">
                        </div>
                        {{ h.title }}
                    </th>
                </tr>
            </thead>
            <tbody>
                <template v-for="(r, idx) of paginated" :key="idx">
                    <tr>
                        <td v-if="multiselect">
                            <input type="checkbox" :checked="r[symRowChecked]"
                                @click="changeChecked($event.target.checked, r)">
                        </td>
                        <td v-if="$slots.extra">
                            <a href="#" @click.prevent="expandChanged(r)" style="text-decoration: none;">
                                {{ r[symRowExpand] ? '∨' : '>' }}
                            </a>
                        </td>
                        <template v-for="h of filteredSelectedColumns" :key="h.key">
                            <td v-if="$slots[h.key]">
                                <slot :name="h.key" :row="r"></slot>
                            </td>
                            <td v-else>
                                {{ r[h.key] }}
                            </td>
                        </template>
                    </tr>
                    <tr v-if="$slots.extra && r[symRowExpand]">
                        <td :colspan="(multiselect ? 2 : 1) + headers.length">
                            <slot name="extra" :row="r"></slot>
                        </td>
                    </tr>
                </template>
            </tbody>
        </table>
        <div v-show="controlsPagination" class="paginator-controls">
            <button type="button" @click="prevPage">&#9664;</button>
            Página <input type="number" :min="1" :max="numPages" v-model="currentPage" @keyup.enter="currentPageEnter">
            de {{
                numPages }}
            <button type="button" @click="nextPage">&#9654;</button>
            <label>
                Filas/Página
                <select v-model="currentRowsPerPage" @change="setNumPages">
                    <option v-for="rp in rowsSelectPage" :key="rp" :value="rp">{{ rp }}</option>
                </select>
            </label>
        </div>
    </div>
</template>

<style scoped>
.filter-controls {
    display: flex;
    justify-content: center;
    align-items: baseline;
}

.sort {
    cursor: pointer;
    margin-right: 0.5rem;
}

.input-filter {
    display: inline-block;
    width: 69%;
}

.table {
    border-collapse: collapse;
    margin: auto;
}

.table th,
.table td {
    border: 1px solid black;
    padding: 0.5rem;
}

.table thead th {
    text-align: center;
}

.table tr:nth-child(even) {
    background-color: rgba(192, 192, 192, 0.205);
}

/* Formato de filas pares */

/* Color de fondo al pasar sobre una fila */
.table tr:hover>td:not(tfoot td) {
    background-color: rgba(154, 228, 241, 0.301);
}

.top-controls {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 3rem;
}

.paginator-controls {
    margin: 0.25rem;
    text-align: center;
    font-family: initial;
}

.filter-selected {
    background-color: lightgreen;
}

.columns-multiselect {
    position: relative;
    margin: 0.16rem;
}

.columns-multiselect-checkboxes {
    position: absolute;
    z-index: 1;
    background-color: lightgray;
    border: 1px solid black;
    max-height: 16rem;
    overflow: auto;
}

.columns-multiselect-label-main {
    background-color: #fff5cc;
}
</style>