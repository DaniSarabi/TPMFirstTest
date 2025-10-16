<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\MaintenanceTemplate;
use App\Models\MaintenanceTemplateSection;
use App\Models\MaintenanceTemplateTask;
use Illuminate\Support\Facades\DB;

class HuberTemplateSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        DB::transaction(function () {
            // 1. Create the Maintenance Template
            $template = MaintenanceTemplate::create([
                'name' => 'Huber monthly maintenance',
                'description' => 'Huber monthly maintenance',
                'category' => 'Huber',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // 2. Create Sections and keep track of old IDs vs new IDs
            $oldSectionIdsToNew = [];
            $sectionsData = [
                [
                    'old_id' => 10,
                    'title' => 'Sistema mecanico',
                    'order' => 4,
                ],
                [
                    'old_id' => 11,
                    'title' => 'Sistema electrico',
                    'order' => 5,
                ],
                [
                    'old_id' => 12,
                    'title' => 'Sistema neumático/bombas de vacío',
                    'order' => 6,
                ],
                [
                    'old_id' => 13,
                    'title' => 'Sistema hidráulico/resinas',
                    'order' => 7,
                ],
            ];

            foreach ($sectionsData as $sectionItem) {
                $newSection = $template->sections()->create([
                    'title' => $sectionItem['title'],
                    'description' => null,
                    'order' => $sectionItem['order'],
                ]);
                $oldSectionIdsToNew[$sectionItem['old_id']] = $newSection->id;
            }

            // 3. Create Tasks, associating them with the new section IDs
            $tasksData = [
                // Root Tasks
                ['section_id' => null, 'order' => 0, 'task_type' => 'header', 'label' => 'Maquina Huber', 'description' => null, 'options' => []],
                ['section_id' => null, 'order' => 1, 'task_type' => 'paragraph', 'label' => 'Paragraph', 'description' => "Localización: Planta 2\nFrecuencia: Mensual", 'options' => []],
                ['section_id' => null, 'order' => 2, 'task_type' => 'bullet_list', 'label' => 'Partes/consumibles a utilizar:', 'description' => null, 'options' => ['list_items' => ["Aceite para bomba de vacio", "Aceite para reductores", "Grasa para bujes/chumaceras", "Grasa para cadenas"]]],
                ['section_id' => null, 'order' => 3, 'task_type' => 'bullet_list', 'label' => 'Nota de seguridad', 'description' => null, 'options' => ['list_items' => ["Asegurarse de contar con el EPP (Casco, zapatos de seguridad, guantes, lentes).", "Utilizar el arnés de seguridad si es necesario.", "Colocar candados de seguridad en los diferentes tipos de energias(electricas, neumatica, hidraulica, mecanica)", "Revise el área de trabajo en caso de una condición insegura"]]],

                // Tasks for Section 10
                ['section_id' => 10, 'order' => 0, 'task_type' => 'checkbox', 'label' => 'Verifique motores por buen funcionanmiento', 'description' => 'Verifique amperaje', 'options' => []],
                ['section_id' => 10, 'order' => 1, 'task_type' => 'checkbox', 'label' => 'Verifique  el  nivel de aceite de cajas de engranes', 'description' => '(agregue si es necesario)', 'options' => []],
                ['section_id' => 10, 'order' => 2, 'task_type' => 'checkbox', 'label' => 'Lubrique con grasa el empaque de la puerta del horno', 'description' => '(si es necesario)', 'options' => ['photo_requirement' => 'optional', 'comment_requirement' => 'optional']],
                ['section_id' => 10, 'order' => 3, 'task_type' => 'checkbox', 'label' => 'Verifique condicion de empaque del horno', 'description' => '(reemplace si es necesario)', 'options' => []],
                ['section_id' => 10, 'order' => 4, 'task_type' => 'pass_fail', 'label' => 'Verifique apertura y cierre de la puerta de horno', 'description' => 'Que funcione correctamente', 'options' => ['comment_requirement' => 'optional']],
                ['section_id' => 10, 'order' => 5, 'task_type' => 'pass_fail', 'label' => 'Verifique buen funcionamiento del mecanismo de manifold', 'description' => null, 'options' => ['comment_requirement' => 'optional']],
                ['section_id' => 10, 'order' => 6, 'task_type' => 'checkbox', 'label' => 'Verifique tecle de la puerta principal por buen funcionamiento', 'description' => 'Lubrique cadena', 'options' => []],
                ['section_id' => 10, 'order' => 7, 'task_type' => 'checkbox', 'label' => 'Verificar que el nivel de acite de las bombas y motores esten funcionando', 'description' => null, 'options' => []],
                ['section_id' => 10, 'order' => 8, 'task_type' => 'pass_fail', 'label' => 'Verificar que el nivel de acite de las bombas y motores esten funcionando', 'description' => null, 'options' => ['comment_requirement' => 'optional']],

                // Tasks for Section 11
                ['section_id' => 11, 'order' => 0, 'task_type' => 'pass_fail', 'label' => 'Verifique buen funcionamiento de pantallas tactil ,botones de gabinete principal', 'description' => null, 'options' => ['comment_requirement' => 'optional']],
                ['section_id' => 11, 'order' => 1, 'task_type' => 'pass_fail', 'label' => 'Verifique buen funcionamiento de luces indicadicadoras, funcionallidad de alarma', 'description' => null, 'options' => ['comment_requirement' => 'optional']],
                ['section_id' => 11, 'order' => 2, 'task_type' => 'checkbox', 'label' => 'Verifique conecciones electricas de cables y sensores a si como correcto ruteo', 'description' => null, 'options' => []],
                ['section_id' => 11, 'order' => 3, 'task_type' => 'checkbox', 'label' => 'Reajuste de conecciones electricas', 'description' => '(gabinete, cajas de controles, válvulas, sensores ,etc)', 'options' => []],
                ['section_id' => 11, 'order' => 4, 'task_type' => 'pass_fail', 'label' => 'Verifique que las resistencias precalentadoras de las tuberias trabajen correctamente y revisar conecciones', 'description' => null, 'options' => []],
                ['section_id' => 11, 'order' => 5, 'task_type' => 'checkbox', 'label' => 'Revision de las lamparas de horno', 'description' => null, 'options' => []],
                ['section_id' => 11, 'order' => 6, 'task_type' => 'pass_fail', 'label' => 'Revisar por buen funcionamiento todas las botoneras perifericas  funcionen correctamente', 'description' => null, 'options' => ['comment_requirement' => 'optional']],
                ['section_id' => 11, 'order' => 7, 'task_type' => 'checkbox', 'label' => 'Revisión de dispositivos de seguridad (como botón de emergencia)', 'description' => null, 'options' => []],

                // Tasks for Section 12
                ['section_id' => 12, 'order' => 0, 'task_type' => 'numeric_input', 'label' => 'Verifique que los manometros esten en buenas condiciones', 'description' => "Presión correcta lbs/vacio.\nRegistre la presion medida.", 'options' => []],
                ['section_id' => 12, 'order' => 1, 'task_type' => 'pass_fail', 'label' => 'Verifique valvulas, pistones neumaticos y revision de mofles', 'description' => 'Que no presenten fugas esten libres de suciedad.', 'options' => []],
                ['section_id' => 12, 'order' => 2, 'task_type' => 'pass_fail', 'label' => 'Checar los mofles de los tanques A y B, bombas de vacio, que no presenten suciedad.', 'description' => null, 'options' => []],
                ['section_id' => 12, 'order' => 3, 'task_type' => 'checkbox', 'label' => 'Inspección de mangueras que se encuentren sin daño y en buen estado', 'description' => null, 'options' => []],
                ['section_id' => 12, 'order' => 4, 'task_type' => 'checkbox', 'label' => 'Revison de mangueras neumaticas que esten ruteadas y no presentes fugas de aire/vacio', 'description' => null, 'options' => []],
                ['section_id' => 12, 'order' => 5, 'task_type' => 'checkbox', 'label' => 'Checar los filtros del aire, filtros de vacio, que esten limpios y sin contaminación.', 'description' => null, 'options' => []],
                ['section_id' => 12, 'order' => 6, 'task_type' => 'checkbox', 'label' => 'Verificar bombas de vacio que esten funcionando correctamente sin ruidos y sin fugas de aceite', 'description' => null, 'options' => []],
                ['section_id' => 12, 'order' => 7, 'task_type' => 'checkbox', 'label' => 'Revision de mangueras del sistema de vacio que esten en buenas condiciones y sin fuga.', 'description' => null, 'options' => []],
                ['section_id' => 12, 'order' => 8, 'task_type' => 'checkbox', 'label' => 'Verificar bancos de valvulas que no presente fugas, manometros que esten en buen estado', 'description' => null, 'options' => []],
                ['section_id' => 12, 'order' => 9, 'task_type' => 'checkbox', 'label' => 'Cambio de aceite y filtro a bombas de vacio.', 'description' => null, 'options' => ['photo_requirement' => 'optional', 'comment_requirement' => 'optional']],

                // Tasks for Section 13
                ['section_id' => 13, 'order' => 0, 'task_type' => 'checkbox', 'label' => 'Inspección de tuberías de la resina y endurecedor que no presenten fugas, corregir si es necesario', 'description' => null, 'options' => []],
                ['section_id' => 13, 'order' => 1, 'task_type' => 'checkbox', 'label' => 'Contenedor A y B verifique mangueras y conexiones que no presenten fugas de resina y acelerador', 'description' => null, 'options' => []],
            ];

            foreach ($tasksData as $taskItem) {
                $template->tasks()->create([
                    'section_id' => $taskItem['section_id'] ? $oldSectionIdsToNew[$taskItem['section_id']] : null,
                    'order' => $taskItem['order'],
                    'task_type' => $taskItem['task_type'],
                    'label' => $taskItem['label'],
                    'description' => $taskItem['description'],
                    'options' => json_encode($taskItem['options']),
                ]);
            }
        });
    }
}
