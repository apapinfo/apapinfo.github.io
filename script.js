function countAllChildNodes(root = document.body) {

    let count = 0;

    for (const child of root.childNodes) {

        count += 1;
        count += countAllChildNodes(child);
    }

    return count;
}








function move_to_next_animation(container, svg, animation_page_list, index_state, raf_ids_list_state) {
    
    console.log(countAllChildNodes());

    raf_ids_list_state.raf_ids_list.length = 0;
    
    if (index_state.animation_page_list_index < animation_page_list.length) {
        
        animate(container, svg, animation_page_list, index_state, raf_ids_list_state);
    }
    else {
        
        index_state.animation_page_list_index = animation_page_list.length - 1;
    }
}








function animate(container, svg, animation_page_list, index_state, raf_ids_list_state) {








    const original_animated_elements_dict = animation_page_list[index_state.animation_page_list_index];
    const hasAnimationPageSubElements = original_animated_elements_dict["hasAnimationPageSubElements"];








    function get_object_copy(object) {

        if (object === null || typeof object !== "object") {

            return object;
        }

        if (object instanceof Date) {

            return new Date(object.getTime());
        }

        if (Array.isArray(object)) {

            return object.map(get_object_copy);
        }

        if (object instanceof Map) {

            return new Map(Array.from(object.entries(), ([k, v]) => [get_object_copy(k), get_object_copy(v)]));
        }

        if (object instanceof Set) {

            return new Set(Array.from(object.values(), get_object_copy));
        }

        const object_copy = {};

        for (const key in object) {

            if (Object.hasOwn(object, key)) {

                object_copy[key] = get_object_copy(object[key]);
            }
        }

        return object_copy;
    }








    function isDict(object) {

        return Object.prototype.toString.call(object) === '[object Object]';
    }








    function get_flatten_animated_elements_dict(animated_elements_dict) {


        const current_animated_elements_dict_stack = [{path : [], value : animated_elements_dict}];
        const flatten_animated_elements_list = [];


        while (current_animated_elements_dict_stack.length > 0) {


            const {path, value} = current_animated_elements_dict_stack.pop();








            if (isDict(value)) {

                const current_level_keys_list = Object.keys(value);


                for (let i = current_level_keys_list.length - 1 ; i >= 0 ; --i) {

                    const current_level_key = current_level_keys_list[i];

                    current_animated_elements_dict_stack.push({path : [...path, current_level_key], value : value[current_level_key]});
                }
            }
            else if (Array.isArray(value)) {

                if (value.length === 8 && 
                Array.isArray(value[0]) && 
                (Array.isArray(value[1])) &&
                [value[0][0], value[2]].every(v => typeof v === "number") && 
                [value[3], value[4]].every(v => typeof v === "boolean") && 
                (Array.isArray(value[5]) && value[5].length === 2) && 
                (Array.isArray(value[6]) && value[6].length === 2) && 
                typeof value[7] === "string") {
                    
                    flatten_animated_elements_list.push({path, value});
                }
                else if (value.length === 8 && 
                (Array.isArray(value[0]) && value[0].length === 2 && 
                (Array.isArray(value[1])) && 
                [value[0][1], value[0][1]].every(v => typeof v === "string")) && 
                [value[3], value[4]].every(v => typeof v === "boolean") && 
                (Array.isArray(value[5]) && value[5].length === 2) && 
                (Array.isArray(value[6]) && value[6].length === 2) && 
                [value[2], value[5][0], value[5][1], value[6][0], value[6][1]].every(v => typeof v === "number") && 
                typeof value[7] === "string") {

                    flatten_animated_elements_list.push({path, value});
                }
                else if (value.length > 0) {

                    for (let i = value.length - 1 ; i >= 0 ; --i) {

                        current_animated_elements_dict_stack.push({path : [...path, i], value : value[i]});
                    }
                }
            }
        }

        return flatten_animated_elements_list;
    }








    function translate_path_to_starting_coordinates(svg, data_path, x_start, y_start, animated_element_width, animated_element_height, preview_mode) {

        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");

        path.setAttribute("d", data_path);

        const first_path_point = path.getPointAtLength(0);

        const dx = (x_start + animated_element_width/2) - first_path_point.x;
        const dy = (y_start + animated_element_height/2) - first_path_point.y;

        (preview_mode) ? path.setAttribute("visibility", "visible") : path.setAttribute("visibility", "hidden");
        path.setAttribute("fill", "none");
        path.setAttribute("stroke", "#ccc");
        path.setAttribute("stroke-width", "2");





        path.setAttribute("transform", `translate(${dx}, ${dy})`);




        svg.appendChild(path);

        return {path, dx, dy};
    }








    function add_animated_elements_to_page(container, svg, flatten_animated_elements_list, preview_mode) {

        for (let i = 0; i < flatten_animated_elements_list.length ; ++i) {

            flatten_animated_elements_list[i]["value"].push(document.createElement('div'));






            const element_time_between_trails = flatten_animated_elements_list[i]["value"][2];
            const x_start = flatten_animated_elements_list[i]["value"][6][0];
            const y_start = flatten_animated_elements_list[i]["value"][6][1];
            const data_path = flatten_animated_elements_list[i]["value"][7];
            const element = flatten_animated_elements_list[i]["value"][8];


            const animated_element_type_key = flatten_animated_elements_list[i]["path"][0];

            element.classList.add(animated_element_type_key);





            element.style.left = `${x_start}px`;
            element.style.top = `${y_start}px`;
            (preview_mode) ? element.style.opacity = 1 : element.style.opacity = 0;






            element.animationStarted = false;
            element.passing = false;
            element.initializedTriggeredPointsList = false;
            (element_time_between_trails > 0) ? element.hasDrags = true : element.hasDrags = false;
            element.isInReverseDirection = false;


            element.animationStartedTime = null;
            element.alternate_mode_switching_value = 0;


            element.triggered_points_list = [];
            element.triggered_path_length_list = [];

            element.triggered_path_length_list_save = [];
            element.triggered_path_length_dict = {};
            element.sub_elements_info_list = [];


            element.animated_sub_elements_dict = {};
            element.animated_sub_elements_dict[animated_element_type_key] = {};
            element.animated_sub_elements_dict["preview_before_first_launch"] = preview_mode;

            element.flatten_animated_sub_elements_list = [];





            container.appendChild(element);

            const {path, dx, dy} = translate_path_to_starting_coordinates(svg, data_path, x_start, y_start, element.getBoundingClientRect().width, element.getBoundingClientRect().height, animated_elements_dict["preview_before_first_launch"]);





            flatten_animated_elements_list[i]["value"].push(path);
            flatten_animated_elements_list[i]["value"].push(dx);
            flatten_animated_elements_list[i]["value"].push(dy);
        }
    }








    function add_element_trails(element) {


        const style = document.createElement("style");

        style.textContent = `
            @keyframes element_trails_fade_in {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            @keyframes element_trails_fade_out {
                from { opacity: 1; }
                to { opacity: 0; }
            }
        `;

        document.head.appendChild(style);



        const element_clone = element.cloneNode(false);



        element_clone.style.zIndex = "inherit";
        element_clone.style.position = "absolute";
        element_clone.style.width = `${element.getBoundingClientRect().width}px`;
        element_clone.style.height = `${element.getBoundingClientRect().height}px`;
        element_clone.style.backgroundColor = getComputedStyle(element).backgroundColor;
        element_clone.style.borderRadius = getComputedStyle(element).borderRadius;


        element_clone.style.left = `${element.getBoundingClientRect().left - (element.getBoundingClientRect().width/2)}px`;
        element_clone.style.top = `${element.getBoundingClientRect().top - (element.getBoundingClientRect().width/2)}px`;

        element_clone.style.animation = "element_trails_fade_in 0.25s forwards";



        container.appendChild(element_clone);


        setTimeout(() => {

            element_clone.style.animation = "element_trails_fade_out 0.25s forwards";

            setTimeout(() => {


                element_clone.remove();
                document.head.removeChild(style);

            }, 250);
                                        
        }, 250);

        

        element.hasDrags = true;
    }








    function add_inclination_angle(element_automatic_inclination_mode_bool, element, path, element_progress, translating_point) {

        if (element_automatic_inclination_mode_bool) {

            if (((path.getTotalLength() * element_progress) + 0.1) <= path.getTotalLength()) {

                const closest_point = path.getPointAtLength((path.getTotalLength() * element_progress) + 0.1);

                const inclination_angle_in_rad = Math.atan2(closest_point.y - translating_point.y, closest_point.x - translating_point.x);

                const inclination_angle_in_deg = inclination_angle_in_rad * (180 / Math.PI);

                const original_transform_origin = getComputedStyle(element).transformOrigin;
                element.style.transformOrigin = "center";
                element.style.transform = `rotate(${inclination_angle_in_deg}deg)`;
                element.style.transformOrigin = original_transform_origin;
            }
        }
    }








    function fill_element_animated_sub_elements_values_dict(element_triggered_points_list, element_triggered_type_path_list, type_path_dict, svg, dx, dy, element, animated_element_type_key, id_key, element_type_beginning_animation_class, element_type_ending_animation_class, element_triggered_info_list, element_time_between_trails, element_automatic_inclination_mode_bool, element_alternate_mode_bool, ending_animation_trigger_progress_percentages_list, element_animated_sub_elements_dict) {

        const temp_list = [];


        for (let i = 0; i < element_triggered_points_list.length ; ++i) {


            if (element_triggered_type_path_list[i] in type_path_dict) {

                const sub_x_start = element_triggered_points_list[i].x + dx - (element.getBoundingClientRect().width/2);
                const sub_y_start = element_triggered_points_list[i].y + dy - (element.getBoundingClientRect().height/2);

                temp_list.push([
                    [element_type_beginning_animation_class, element_type_ending_animation_class],
                    element_triggered_info_list,
                    element_time_between_trails,
                    element_automatic_inclination_mode_bool,
                    element_alternate_mode_bool,
                    ending_animation_trigger_progress_percentages_list,
                    [sub_x_start, sub_y_start],
                    type_path_dict[element_triggered_type_path_list[i]]
                ]);
            }
        }

        element_animated_sub_elements_dict[animated_element_type_key][id_key] = [...temp_list];
    }








    function delete_all_animated_elements_at_current_animation_ending(container, svg, animation_page_list, index_state, raf_ids_list_state, hasAnimationPageSubElements) {

        if (hasAnimationPageSubElements) {

            let timeoutId;

            observer = new MutationObserver(() => {

                clearTimeout(timeoutId);

                timeoutId = setTimeout(() => {

                    observer.disconnect();

                    if (animation_page_list[index_state.animation_page_list_index]["animation_page_effect_class_to_activate"] && typeof animation_page_list[index_state.animation_page_list_index]["animation_page_effect_class_to_activate"] === "string") {

                        const element_to_modify = document.getElementById(animation_page_list[index_state.animation_page_list_index]["animation_page_effect_class_to_activate"])

                        if (element_to_modify) {

                            element_to_modify.classList.remove(animation_page_list[index_state.animation_page_list_index]["animation_page_effect_class_to_activate"]);

                            void element_to_modify.offsetWidth;

                            element_to_modify.classList.add(animation_page_list[index_state.animation_page_list_index]["animation_page_effect_class_to_activate"].concat("-activated"));

                            const children = element_to_modify.querySelectorAll('*');

                            children.forEach((el) => {

                                    const animated_class_list = Array.from(el.classList).filter(c => c.startsWith('animated-'));

                                    animated_class_list.forEach(cls => el.classList.remove(cls));

                                    void el.offsetWidth;

                                    animated_class_list.forEach(cls => el.classList.add(cls));
                                }
                            );
                        }
                    }

                    index_state.animation_page_list_index += 1;
                    move_to_next_animation(container, svg, animation_page_list, index_state, raf_ids_list_state);
                                        
                }, 1000);
            });


            observer.observe(container, {

                childList: true,
                attributes: true,
                subtree: true,
            });
        }
        else {

            if (animation_page_list[index_state.animation_page_list_index]["animation_page_effect_class_to_activate"] && typeof animation_page_list[index_state.animation_page_list_index]["animation_page_effect_class_to_activate"] === "string") {

                const element_to_modify = document.getElementById(animation_page_list[index_state.animation_page_list_index]["animation_page_effect_class_to_activate"])

                if (element_to_modify) {

                    element_to_modify.classList.remove(animation_page_list[index_state.animation_page_list_index]["animation_page_effect_class_to_activate"]);

                    void element_to_modify.offsetWidth;

                    element_to_modify.classList.add(animation_page_list[index_state.animation_page_list_index]["animation_page_effect_class_to_activate"].concat("-activated"));

                    const children = element_to_modify.querySelectorAll('*');

                    children.forEach((el) => {

                            const animated_class_list = Array.from(el.classList).filter(c => c.startsWith('animated-'));

                            animated_class_list.forEach(cls => el.classList.remove(cls));

                            void el.offsetWidth;

                            animated_class_list.forEach(cls => el.classList.add(cls));
                        }
                    );
                }
            }

            const svg_children = Array.from(svg.children);

            for (const child of svg_children) {

                svg.removeChild(child);
            }

            const container_children = Array.from(container.children);

            for (const child of container_children) {

                if (child.id !== svg.id) {

                    container.removeChild(child);
                }
            }

            index_state.animation_page_list_index += 1;
            move_to_next_animation(container, svg, animation_page_list, index_state, raf_ids_list_state);
        }
    }








    function start_animation(time) {

        if (!animationStartTime) animationStartTime = time;


        const elapsed = time - animationStartTime;



        const global_progress = Math.min(elapsed / animated_elements_dict["first_level_animation_speeds_list"][first_level_animation_speeds_list_index], 1);



        let global_i = 0;








        function animate_elements() {

            if (global_i === flatten_animated_elements_list.length) return;



            const animated_element_type_key = flatten_animated_elements_list[global_i]["path"][0];
            const id_key = flatten_animated_elements_list[global_i]["path"][1];

            const element_type_beginning_animation_class = animated_elements_dict[animated_element_type_key]["animation_class"][0];
            const element_type_ending_animation_class = animated_elements_dict[animated_element_type_key]["animation_class"][1];



            const elements_list = flatten_animated_elements_list[global_i]["value"];

            const element_triggered_number = elements_list[0][0];
            const element_triggered_durations_list = elements_list[0][1];
            const element_triggered_type_path_list = elements_list[0][2];

            const element_triggered_info_list = elements_list[1];
            const element_time_between_trails = elements_list[2];
            const element_automatic_inclination_mode_bool = elements_list[3];
            const element_alternate_mode_bool = elements_list[4];
            const ending_animation_trigger_progress_percentages_list = elements_list[5];
            const element = elements_list[8];
            const path = elements_list[9];
            const dx = elements_list[10];
            const dy = elements_list[11];


            const element_progress = Math.abs(global_progress + element.alternate_mode_switching_value);


            const translating_point = path.getPointAtLength(path.getTotalLength() * element_progress);
            



            add_inclination_angle(element_automatic_inclination_mode_bool, element, path, element_progress, translating_point);



            const x = (translating_point.x) + dx;
            const y = (translating_point.y) + dy;



            element.style.left = `${x - (element.getBoundingClientRect().width/2)}px`;
            element.style.top = `${y - (element.getBoundingClientRect().height/2)}px`;




            if (!element.animationStarted) {

                element.animationStarted = true;

                element.classList.add(element_type_beginning_animation_class);
            }


            if (element.hasDrags) {

                element.hasDrags = false;


                setTimeout(() => {
                    if (element.animationStarted && element.classList.contains(element_type_beginning_animation_class) && element_time_between_trails > 0) add_element_trails(element);

                }, element_time_between_trails);
            }




            if (element_triggered_number >= 1 && element_triggered_number === element_triggered_type_path_list.length && !element.initializedTriggeredPointsList) {


                let path_length = path.getTotalLength() * (1/(element_triggered_number + 1));


                element.triggered_points_list.push(path.getPointAtLength(path_length));
                element.triggered_path_length_list.push(path_length);
                element.triggered_path_length_dict["0"] = path_length;


                if (element_triggered_number >= 2) {

                    for (let j = 2 ; j <= element_triggered_number ; ++j) {

                        element.triggered_points_list.push(path.getPointAtLength(path_length * j));
                        element.triggered_path_length_list.push(path_length * j);
                        element.triggered_path_length_dict[String(j - 1)] = path_length * j;
                    }
                }


                if (element.triggered_path_length_list_save.length === 0) {

                    element.triggered_path_length_list_save = [...element.triggered_path_length_list];
                }

                element.initializedTriggeredPointsList = true;




                fill_element_animated_sub_elements_values_dict(element.triggered_points_list, element_triggered_type_path_list, type_path_dict, svg, dx, dy, element, animated_element_type_key, id_key, element_type_beginning_animation_class, element_type_ending_animation_class, element_triggered_info_list, element_time_between_trails, element_automatic_inclination_mode_bool, element_alternate_mode_bool, ending_animation_trigger_progress_percentages_list, element.animated_sub_elements_dict);

                element.flatten_animated_sub_elements_list = get_flatten_animated_elements_dict(element.animated_sub_elements_dict);

                add_animated_elements_to_page(container, svg, element.flatten_animated_sub_elements_list);



                element.sub_elements_info_list = element.flatten_animated_sub_elements_list;





                path_length = 0;
            }       




            if (element.initializedTriggeredPointsList && !(element.triggered_path_length_list.length === 0)) {

                let sub_element_index = null;


                for (let triggered_path_length of element.triggered_path_length_list) {


                    if ((!element.isInReverseDirection && ((path.getTotalLength() * global_progress) >= triggered_path_length))
                    || (element.isInReverseDirection && ((path.getTotalLength() * global_progress) <= triggered_path_length))) {


                        const triggered_path_length_list_index = element.triggered_path_length_list.indexOf(triggered_path_length);

                        if (triggered_path_length_list_index !== -1) {

                            element.triggered_path_length_list.splice(triggered_path_length_list_index, 1);
                        }


                        for (let triggered_path_length_key in element.triggered_path_length_dict) {

                            if (element.triggered_path_length_dict[triggered_path_length_key] === triggered_path_length) {

                                sub_element_index = parseInt(triggered_path_length_key);
                            }
                        }
                    }
                }




                if (Number.isInteger(sub_element_index)) {


                    if (element.sub_elements_info_list[sub_element_index]["value"]) {

                        const sub_element_info_list = element.sub_elements_info_list[sub_element_index]["value"];
                        const sub_element = sub_element_info_list[8];








                        function animate_sub_elements(time) {

                            if (!sub_element.animationStartedTime) sub_element.animationStartedTime = time;



                            const sub_elapsed = time - sub_element.animationStartedTime;

                            const sub_progress = Math.min(sub_elapsed / element_triggered_durations_list[sub_element_index], 1);
                                        
                            

                            const sub_element_background_image = sub_element_info_list[1][0];
                            const sub_element_width = sub_element_info_list[1][1];
                            const sub_element_height = sub_element_info_list[1][2];


                            const sub_element_time_between_trails = sub_element_info_list[2];
                            const sub_element_automatic_inclination_mode = sub_element_info_list[3];
                            const sub_element_alternate_mode_bool = sub_element_info_list[4];
                            const sub_element_ending_animation_trigger_progress_percentages_list = sub_element_info_list[5];
                            const sub_path = sub_element_info_list[9];
                            const sub_dx = sub_element_info_list[10];
                            const sub_dy = sub_element_info_list[11];



                            const sub_element_sub_progress = Math.abs(sub_progress + sub_element.alternate_mode_switching_value);


                            const sub_translating_point = sub_path.getPointAtLength(sub_path.getTotalLength() * sub_element_sub_progress);
                            add_inclination_angle(sub_element_automatic_inclination_mode, sub_element, sub_path, sub_element_sub_progress, sub_translating_point);
                            const sub_x = (sub_translating_point.x) + sub_dx;
                            const sub_y = (sub_translating_point.y) + sub_dy;

                            if (element_triggered_type_path_list[0] !== "point") {

                                sub_element.style.left = `${sub_x - (sub_element.getBoundingClientRect().width/2)}px`;
                                sub_element.style.top = `${sub_y - (sub_element.getBoundingClientRect().height/2)}px`;
                            }
                            
                            const regex = /^url\(['"]\.\/Assets\/[^'"]+\.(png|jpg|jpeg|gif|webp)['"]\)$/;
                            if (regex.test(sub_element_background_image)) { 
                                
                                sub_element.style.backgroundImage = sub_element_background_image;
                                sub_element.style.backgroundSize = "contain";
                            }

                            sub_element.style.width = `${sub_element_width}px`;
                            sub_element.style.height = `${sub_element_height}px`;
                                

                            if (!sub_element.animationStarted) {

                                sub_element.animationStarted = true;

                                sub_element.classList.add(element_type_beginning_animation_class);
                            }


                            if (sub_element.hasDrags) {

                                sub_element.hasDrags = false;

                                setTimeout(() => {

                                    if (sub_element.animationStarted && sub_element.classList.contains(element_type_beginning_animation_class) && sub_element_time_between_trails > 0) add_element_trails(sub_element);

                                }, sub_element_time_between_trails);
                            }


                            if (!sub_element.isInReverseDirection && sub_element_sub_progress > sub_element_ending_animation_trigger_progress_percentages_list[0] && !sub_element.passing) {

                                sub_element.passing = true;
                                sub_element.classList.remove(element_type_beginning_animation_class);

                                void sub_element.offsetWidth;
 
                                sub_element.classList.add(element_type_ending_animation_class);
                            }


                            if (!sub_element.isInReverseDirection && sub_element_sub_progress < 1) {

                                const id = requestAnimationFrame(animate_sub_elements);
                                raf_ids_list_state.raf_ids_list.push(id);
                            }
                            else if (!sub_element.isInReverseDirection && sub_element_sub_progress === 1) {

                                setTimeout(() => {

                                    (sub_element_time_between_trails > 0) ? sub_element.hasDrags = true : sub_element.hasDrags = false;

                                    sub_element.classList.remove(element_type_ending_animation_class);
                                    sub_element.animationStarted = false;
                                    sub_element.passing = false;

                                    if (sub_element_alternate_mode_bool) {

                                        sub_element.alternate_mode_switching_value = -1;
                                        sub_element.isInReverseDirection = true;
                                    }

                                    sub_element.animationStartedTime = null;

                                }, animated_elements_dict["pause_between_animations_list"][pause_between_animations_list_index]);
                            }


                            if (sub_element.isInReverseDirection && sub_element_sub_progress < sub_element_ending_animation_trigger_progress_percentages_list[1] && !sub_element.passing) {

                                sub_element.passing = true;
                                sub_element.classList.remove(element_type_beginning_animation_class);

                                void sub_element.offsetWidth;

                                sub_element.classList.add(element_type_ending_animation_class);
                            }


                            if (sub_element.isInReverseDirection && sub_element_sub_progress > 0) {

                                const id = requestAnimationFrame(animate_sub_elements);
                                raf_ids_list_state.raf_ids_list.push(id);
                            }
                            else if (sub_element.isInReverseDirection && sub_element_sub_progress === 0) {

                                setTimeout(() => {

                                    (sub_element_time_between_trails > 0) ? sub_element.hasDrags = true : sub_element.hasDrags = false;
                                    
                                    sub_element.classList.remove(element_type_ending_animation_class);
                                    sub_element.animationStarted = false;
                                    sub_element.passing = false;

                                    sub_element.alternate_mode_switching_value = 0;
                                    sub_element.isInReverseDirection = false;

                                    sub_element.animationStartedTime = null;

                                }, animated_elements_dict["pause_between_animations_list"][pause_between_animations_list_index]);
                            }
                        }








                        const id = requestAnimationFrame(animate_sub_elements);
                        raf_ids_list_state.raf_ids_list.push(id);
                    }
                }
            }


            if (!element.isInReverseDirection && element_progress > ending_animation_trigger_progress_percentages_list[0] && !element.passing) {

                element.passing = true;
                element.classList.remove(element_type_beginning_animation_class);

                void element.offsetWidth;

                element.classList.add(element_type_ending_animation_class);
            }
            else if (element.isInReverseDirection && element_progress < ending_animation_trigger_progress_percentages_list[1] && !element.passing) {

                element.passing = true;
                element.classList.remove(element_type_beginning_animation_class);

                void element.offsetWidth;

                element.classList.add(element_type_ending_animation_class);
            }



            global_i++;
            animate_elements();
        }








        animate_elements();


        if (global_progress < 1) {
            
            const id = requestAnimationFrame(start_animation);
            raf_ids_list_state.raf_ids_list.push(id);
        }

        else {

            setTimeout(() => {



                for (let i = 0 ; i < flatten_animated_elements_list.length ; ++i) {

                    const element = flatten_animated_elements_list[i]["value"][8];
                    const animated_element_type_key = flatten_animated_elements_list[i]["path"][0];
                    const element_time_between_trails = flatten_animated_elements_list[i]["value"][2];

                    (element_time_between_trails > 0) ? element.hasDrags = true : element.hasDrags = false;

                    element.classList.remove(animated_elements_dict[animated_element_type_key]["animation_class"][1]);
                    element.animationStarted = false;
                    element.passing = false;
                    element.triggered_path_length_list.length = 0;
                    element.triggered_path_length_list = [...element.triggered_path_length_list_save];

                    const element_alternate_mode_bool = flatten_animated_elements_list[i]["value"][4];

                    if (element_alternate_mode_bool) {

                        if (!element.isInReverseDirection) {

                            element.alternate_mode_switching_value = -1;
                            element.isInReverseDirection = true;
                        }
                        else {

                            element.alternate_mode_switching_value = 0;
                            element.isInReverseDirection = false;
                        }
                    }
                }



                animationStartTime = null;

                first_level_animation_speeds_list_index += 1;
                if (first_level_animation_speeds_list_index === animated_elements_dict["first_level_animation_speeds_list"].length) first_level_animation_speeds_list_index = 0;

                pause_between_animations_list_index += 1;
                if (pause_between_animations_list_index === animated_elements_dict["pause_between_animations_list"].length) pause_between_animations_list_index = 0;


                if (global_animation_repetition_number >= 0) {

                    global_animation_repetition_number -= 1;

                    if (global_animation_repetition_number === 0) {

                        if (!animated_elements_dict["preview_before_first_launch"]) {

 
                            delete_all_animated_elements_at_current_animation_ending(container, svg, animation_page_list, index_state, raf_ids_list_state, hasAnimationPageSubElements);
                        }
                    }
                    else if (global_animation_repetition_number > 0) {

                        const id = requestAnimationFrame(start_animation);
                        raf_ids_list_state.raf_ids_list.push(id);
                    }
                }
                else if (global_animation_repetition_number === -1) {

                    const id = requestAnimationFrame(start_animation);
                    raf_ids_list_state.raf_ids_list.push(id);
                }

            }, animated_elements_dict["pause_between_animations_list"][pause_between_animations_list_index]);
        }
    }








    const type_path_dict = {

        "point" : "M 0 0",
        "cursor" : "m 237,210 c 6.13403,10.04346 9.17043,21.89425 13,33 12.46778,36.15656 -1.43854,-0.1648 15,36 2.2284,4.90247 3.59168,10.18336 6,15 3.60555,7.2111 7.81586,14.10848 12,21 1.48814,2.45105 3.71764,4.43528 5,7 0.44721,0.89443 -0.53,2.152 0,3 1.24922,1.99875 3.73457,3.01147 5,5 2.21263,3.477 2.29854,7.82732 6,11 1.47573,1.26491 3.62563,1.62563 5,3 1.65425,1.65425 6.00477,10.33969 8,13 1.57219,2.09626 3.37678,2.37678 4,3 0.2357,0.2357 -0.2357,0.7643 0,1 0.2357,0.2357 0.70186,-0.14907 1,0 2.49738,1.24869 5.05834,4.05834 7,6 3.94351,3.94351 4.48523,2.48523 5,3 0.2357,0.2357 -0.2357,0.7643 0,1 2.06903,2.06903 -0.0809,-3.16176 2,1 0.14907,0.29814 0.0808,1.32338 0,1 -0.41223,-1.64893 -0.66667,-3.33333 -1,-5",
        "context_menu" : "M 0 0",
        "wave" : "M 0 0 C 100 -100, 200 100, 300 0",
        "heart" : "M0 30 A20 20 0 0 1 40 30 A20 20 0 0 1 80 30 Q80 60 40 90 Q0 60 0 30 Z",
        "random" : "M 0 0 C 20 -30, 60 -30, 80 0 C 20 30, -20 60, -40 60 C -20 0, -60 -30, -40 -60 Z",
        "horizontal_line" : "M 0 0 H 50",
        "vertical_line" : "M 0 0 V 50",
        "flying-bird-trajectory-1" : "m 249.17205,241.92 c 0,0 74.88,-5.76 80.64,-35.84",
        "flying-bird-trajectory-2" : "m 218.1891,229.59621 c 0,0 -129.8691,5.28379 -138.8291,-27.99621",
        "petal-trajectory" : "m 245.12,104.32 c 0,0 -10.88,49.28 11.52,37.76 0,0 -39.04,-35.2 11.52,32"

    };

    let animated_elements_dict = get_object_copy(original_animated_elements_dict);

    const flatten_animated_elements_list = get_flatten_animated_elements_dict(animated_elements_dict);

    add_animated_elements_to_page(container, svg, flatten_animated_elements_list, animated_elements_dict["preview_before_first_launch"]);

    let animationStartTime = null;

    let first_level_animation_speeds_list_index = 0;
    let pause_between_animations_list_index = 0;
    let global_animation_repetition_number = animated_elements_dict["global_animation_repetition_number"];

    setTimeout(() => {

        const id = requestAnimationFrame(start_animation);
        raf_ids_list_state.raf_ids_list.push(id);
        
    }, animated_elements_dict["time_before_first_launch"]);

}
















const container = document.getElementById("dynamic-background");
const svg = document.getElementById("background-svg");

const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
















const animation_page_1 = {

    "animated-point" : {

        "points" : [
            [
                [0],
                [],
                5,
                false,
                false,
                [0.9, 0.1],
                [(window.innerWidth * 0.5) - 2 * rem, (window.innerHeight * 0.5)],
                `
                m 176.01419,228.27708
                c 0.87423,-2.76839 1.31134,-4.66256 1.60275,-5.39108 0.87423,-3.49692 1.74846,-6.84814 2.62269,-10.19935 0.87423,-3.49692 1.74846,-6.99384 2.7684,-10.49076 0.1457,-0.58282 0.58282,-2.62269 1.16564,-5.39109
                l 5.68249,-4.80826
                c -3.78833,-0.29141 -6.41102,-0.29141 -8.45089,-0.29141 -14.27909,0 -24.04132,2.62269 -31.90939,8.45089 -7.86807,5.8282 -11.36499,12.53063 -11.36499,21.71004 0,2.33128 0.29141,3.78833 1.16564,7.28525
                l 10.92787,-3.64262
                c -1.31134,-4.66256 -1.60275,-6.84814 -1.60275,-10.05365 0,-8.01377 3.35121,-13.84197 9.17941,-16.46466 3.64263,-1.45705 7.13955,-1.89417 16.02755,-1.89417 -2.18557,7.13955 -2.33128,7.86807 -7.28525,27.24684
                l -1.01993,4.22544 -5.24538,5.53679 3.78833,0.29141
                c -6.99384,27.10113 -10.19935,31.03517 -25.78979,31.03517 -2.33128,0 -4.07974,0 -7.72236,-0.29141
                l -6.84814,9.47082
                c 3.20551,0.43712 4.51686,0.58282 7.13955,0.58282 4.66256,0 8.30518,-0.43711 11.21928,-1.45705 4.51686,-1.31134 11.80211,-7.13954 19.37877,-15.00761 7.72236,-8.01378 8.15948,-8.88801 12.96774,-24.04133 18.06742,-1.16564 23.3128,-1.45705 31.47228,-1.60275 -0.72852,3.0598 -1.31134,5.09967 -1.45705,5.9739
                l -3.35121,12.38493
                c -5.09968,20.3987 -5.09968,20.3987 -5.09968,22.29286 0,1.60276 1.45705,3.05981 3.20551,3.05981 1.01994,0 2.47699,-0.29141 4.07974,-0.72853 3.78833,-1.01993 6.11961,-1.45705 22.00146,-4.37115
                l 2.62269,-3.64262
                c -7.57666,0.72852 -10.05365,0.87423 -13.84198,0.87423 -2.9141,0 -4.66256,-1.45705 -4.66256,-3.93404 0,-4.51685 0,-4.51685 9.32512,-40.7974 9.32512,-32.49221 9.32512,-32.49221 11.07358,-35.26061 2.18558,-3.49692 4.66256,-4.95397 8.7423,-4.95397 2.9141,0 4.51686,0.29141 7.72237,1.45705
                l 4.95397,-8.01377
                c -2.62269,-0.87423 -3.78833,-1.01994 -6.41102,-1.01994 -1.89417,0 -3.35122,0.14571 -4.80827,0.58282 -3.64262,1.16564 -11.07358,6.99384 -17.33889,13.55057 -5.8282,6.26531 -7.86807,10.05364 -10.34506,19.08735
                l -3.93403,14.13339
                c -0.14571,0.43711 -0.58282,2.03987 -1.31135,4.51685
                z

                m 97.33071,26.95543
                c -11.6564,9.90794 -17.92172,13.55056 -23.45851,13.55056 -3.78833,0 -6.70243,-2.47698 -7.72236,-6.26531 -0.58282,-2.33128 -0.72853,-3.93404 -0.72853,-8.15948 6.70243,-4.22545 10.78217,-7.13955 19.37877,-13.55057 8.01377,-5.9739 10.92787,-10.78217 10.92787,-17.33889 0,-5.09968 -3.0598,-8.15948 -8.30518,-8.15948 -3.20551,0 -5.39109,0.72852 -8.88801,2.62269 -5.53679,3.20551 -10.49076,7.13954 -13.40486,10.63646 -5.53679,6.70243 -10.49076,22.72998 -10.49076,34.53209 0,8.59659 4.51686,13.98768 11.94781,13.98768 8.5966,0 19.67018,-6.41102 30.59805,-17.63031
                z

                m -31.47228,-6.11961
                c 2.47698,-15.73614 9.03371,-27.68395 15.44473,-27.68395 2.33128,0 3.93403,2.33128 3.93403,5.9739 0,7.28525 -4.22544,11.94781 -19.37876,21.71005
                z

                m 71.24929,7.28525
                c -3.05981,1.74846 -3.05981,1.74846 -9.32512,5.68249 -4.22545,2.62269 -6.70243,3.78833 -8.30519,3.78833 -1.45705,0 -2.62269,-1.74846 -2.62269,-3.78833
                v -1.31134 -1.31135
                c 0,-2.62269 6.55673,-30.88946 11.94781,-51.43386 5.6825,-21.56434 6.99384,-24.04133 13.40486,-24.04133 2.18558,0 3.64263,0.14571 7.13955,1.01994
                l 6.26531,-7.72237
                c -3.0598,-0.72852 -4.51685,-0.87423 -6.55672,-0.87423 -5.8282,0 -10.34506,2.18558 -17.4846,8.5966 -6.41102,5.68249 -8.01378,8.01377 -9.90794,13.25915 -1.16564,3.49692 -4.37115,15.29903 -5.8282,21.71005
                l -10.49076,45.60566
                c -0.14571,0.87423 -0.29141,1.74846 -0.29141,2.62269 0,4.51686 2.47698,8.88801 4.80826,8.88801
                h 0.87423 0.43712
                c 0.87423,0.43711 5.53679,-2.7684 25.93549,-17.4846
                z

                m 34.96916,0
                c -3.05981,1.74846 -3.05981,1.74846 -9.32512,5.68249 -4.22545,2.62269 -6.70243,3.78833 -8.30519,3.78833 -1.45705,0 -2.62269,-1.74846 -2.62269,-3.78833
                v -1.31134 -1.31135
                c 0,-2.62269 6.55673,-30.88946 11.94781,-51.43386 5.6825,-21.56434 6.99384,-24.04133 13.40487,-24.04133 2.18557,0 3.64262,0.14571 7.13954,1.01994
                l 6.26532,-7.72237
                c -3.05981,-0.72852 -4.51686,-0.87423 -6.55673,-0.87423 -5.8282,0 -10.34506,2.18558 -17.4846,8.5966 -6.41102,5.68249 -8.01378,8.01377 -9.90794,13.25915 -1.16564,3.49692 -4.37115,15.29903 -5.8282,21.71005
                l -10.49076,45.60566
                c -0.14571,0.87423 -0.29141,1.74846 -0.29141,2.62269 0,4.51686 2.47698,8.88801 4.80826,8.88801
                h 0.87423 0.43712
                c 0.87423,0.43711 5.53679,-2.7684 25.93549,-17.4846
                z

                m 42.54582,-41.08881
                c -5.8282,0 -15.15332,4.22544 -23.74991,10.63646 -9.32512,6.99384 -15.88185,22.14716 -15.88185,36.71766 0,8.7423 4.95397,14.4248 12.67634,14.4248 4.07974,0 8.30518,-1.45705 14.86191,-4.95397 7.28525,-4.07974 12.09351,-7.72237 14.7162,-11.07358 5.8282,-8.01378 10.49076,-22.29287 10.49076,-32.34651 0,-7.86807 -5.39108,-13.40486 -13.11345,-13.40486
                z

                m -7.57666,6.84813
                c 5.8282,0 9.47083,5.53679 9.47083,14.4248 0,6.26531 -2.03987,13.69627 -5.53679,20.83581 -4.22545,8.30519 -9.47083,12.82204 -15.00762,12.82204 -5.9739,0 -9.76223,-5.39108 -9.76223,-13.69627 0,-16.90178 10.63646,-34.38638 20.83581,-34.38638
                z
                `
            ]
        ],
        "animation_class" : [
            "animated-point-animation-beginning",
            "animated-point-animation-ending"
        ]

    },

    "animated-pencil" : {

        "pencil" : [
            [
                [0],
                [],
                0,
                false,
                false,
                [0.9, 0.1],
                [(window.innerWidth * 0.5) - 2 * rem, (window.innerHeight * 0.5)],
                `
                m 176.01419,228.27708
                c 0.87423,-2.76839 1.31134,-4.66256 1.60275,-5.39108 0.87423,-3.49692 1.74846,-6.84814 2.62269,-10.19935 0.87423,-3.49692 1.74846,-6.99384 2.7684,-10.49076 0.1457,-0.58282 0.58282,-2.62269 1.16564,-5.39109
                l 5.68249,-4.80826
                c -3.78833,-0.29141 -6.41102,-0.29141 -8.45089,-0.29141 -14.27909,0 -24.04132,2.62269 -31.90939,8.45089 -7.86807,5.8282 -11.36499,12.53063 -11.36499,21.71004 0,2.33128 0.29141,3.78833 1.16564,7.28525
                l 10.92787,-3.64262
                c -1.31134,-4.66256 -1.60275,-6.84814 -1.60275,-10.05365 0,-8.01377 3.35121,-13.84197 9.17941,-16.46466 3.64263,-1.45705 7.13955,-1.89417 16.02755,-1.89417 -2.18557,7.13955 -2.33128,7.86807 -7.28525,27.24684
                l -1.01993,4.22544 -5.24538,5.53679 3.78833,0.29141
                c -6.99384,27.10113 -10.19935,31.03517 -25.78979,31.03517 -2.33128,0 -4.07974,0 -7.72236,-0.29141
                l -6.84814,9.47082
                c 3.20551,0.43712 4.51686,0.58282 7.13955,0.58282 4.66256,0 8.30518,-0.43711 11.21928,-1.45705 4.51686,-1.31134 11.80211,-7.13954 19.37877,-15.00761 7.72236,-8.01378 8.15948,-8.88801 12.96774,-24.04133 18.06742,-1.16564 23.3128,-1.45705 31.47228,-1.60275 -0.72852,3.0598 -1.31134,5.09967 -1.45705,5.9739
                l -3.35121,12.38493
                c -5.09968,20.3987 -5.09968,20.3987 -5.09968,22.29286 0,1.60276 1.45705,3.05981 3.20551,3.05981 1.01994,0 2.47699,-0.29141 4.07974,-0.72853 3.78833,-1.01993 6.11961,-1.45705 22.00146,-4.37115
                l 2.62269,-3.64262
                c -7.57666,0.72852 -10.05365,0.87423 -13.84198,0.87423 -2.9141,0 -4.66256,-1.45705 -4.66256,-3.93404 0,-4.51685 0,-4.51685 9.32512,-40.7974 9.32512,-32.49221 9.32512,-32.49221 11.07358,-35.26061 2.18558,-3.49692 4.66256,-4.95397 8.7423,-4.95397 2.9141,0 4.51686,0.29141 7.72237,1.45705
                l 4.95397,-8.01377
                c -2.62269,-0.87423 -3.78833,-1.01994 -6.41102,-1.01994 -1.89417,0 -3.35122,0.14571 -4.80827,0.58282 -3.64262,1.16564 -11.07358,6.99384 -17.33889,13.55057 -5.8282,6.26531 -7.86807,10.05364 -10.34506,19.08735
                l -3.93403,14.13339
                c -0.14571,0.43711 -0.58282,2.03987 -1.31135,4.51685
                z

                m 97.33071,26.95543
                c -11.6564,9.90794 -17.92172,13.55056 -23.45851,13.55056 -3.78833,0 -6.70243,-2.47698 -7.72236,-6.26531 -0.58282,-2.33128 -0.72853,-3.93404 -0.72853,-8.15948 6.70243,-4.22545 10.78217,-7.13955 19.37877,-13.55057 8.01377,-5.9739 10.92787,-10.78217 10.92787,-17.33889 0,-5.09968 -3.0598,-8.15948 -8.30518,-8.15948 -3.20551,0 -5.39109,0.72852 -8.88801,2.62269 -5.53679,3.20551 -10.49076,7.13954 -13.40486,10.63646 -5.53679,6.70243 -10.49076,22.72998 -10.49076,34.53209 0,8.59659 4.51686,13.98768 11.94781,13.98768 8.5966,0 19.67018,-6.41102 30.59805,-17.63031
                z

                m -31.47228,-6.11961
                c 2.47698,-15.73614 9.03371,-27.68395 15.44473,-27.68395 2.33128,0 3.93403,2.33128 3.93403,5.9739 0,7.28525 -4.22544,11.94781 -19.37876,21.71005
                z

                m 71.24929,7.28525
                c -3.05981,1.74846 -3.05981,1.74846 -9.32512,5.68249 -4.22545,2.62269 -6.70243,3.78833 -8.30519,3.78833 -1.45705,0 -2.62269,-1.74846 -2.62269,-3.78833
                v -1.31134 -1.31135
                c 0,-2.62269 6.55673,-30.88946 11.94781,-51.43386 5.6825,-21.56434 6.99384,-24.04133 13.40486,-24.04133 2.18558,0 3.64263,0.14571 7.13955,1.01994
                l 6.26531,-7.72237
                c -3.0598,-0.72852 -4.51685,-0.87423 -6.55672,-0.87423 -5.8282,0 -10.34506,2.18558 -17.4846,8.5966 -6.41102,5.68249 -8.01378,8.01377 -9.90794,13.25915 -1.16564,3.49692 -4.37115,15.29903 -5.8282,21.71005
                l -10.49076,45.60566
                c -0.14571,0.87423 -0.29141,1.74846 -0.29141,2.62269 0,4.51686 2.47698,8.88801 4.80826,8.88801
                h 0.87423 0.43712
                c 0.87423,0.43711 5.53679,-2.7684 25.93549,-17.4846
                z

                m 34.96916,0
                c -3.05981,1.74846 -3.05981,1.74846 -9.32512,5.68249 -4.22545,2.62269 -6.70243,3.78833 -8.30519,3.78833 -1.45705,0 -2.62269,-1.74846 -2.62269,-3.78833
                v -1.31134 -1.31135
                c 0,-2.62269 6.55673,-30.88946 11.94781,-51.43386 5.6825,-21.56434 6.99384,-24.04133 13.40487,-24.04133 2.18557,0 3.64262,0.14571 7.13954,1.01994
                l 6.26532,-7.72237
                c -3.05981,-0.72852 -4.51686,-0.87423 -6.55673,-0.87423 -5.8282,0 -10.34506,2.18558 -17.4846,8.5966 -6.41102,5.68249 -8.01378,8.01377 -9.90794,13.25915 -1.16564,3.49692 -4.37115,15.29903 -5.8282,21.71005
                l -10.49076,45.60566
                c -0.14571,0.87423 -0.29141,1.74846 -0.29141,2.62269 0,4.51686 2.47698,8.88801 4.80826,8.88801
                h 0.87423 0.43712
                c 0.87423,0.43711 5.53679,-2.7684 25.93549,-17.4846
                z

                m 42.54582,-41.08881
                c -5.8282,0 -15.15332,4.22544 -23.74991,10.63646 -9.32512,6.99384 -15.88185,22.14716 -15.88185,36.71766 0,8.7423 4.95397,14.4248 12.67634,14.4248 4.07974,0 8.30518,-1.45705 14.86191,-4.95397 7.28525,-4.07974 12.09351,-7.72237 14.7162,-11.07358 5.8282,-8.01378 10.49076,-22.29287 10.49076,-32.34651 0,-7.86807 -5.39108,-13.40486 -13.11345,-13.40486
                z

                m -7.57666,6.84813
                c 5.8282,0 9.47083,5.53679 9.47083,14.4248 0,6.26531 -2.03987,13.69627 -5.53679,20.83581 -4.22545,8.30519 -9.47083,12.82204 -15.00762,12.82204 -5.9739,0 -9.76223,-5.39108 -9.76223,-13.69627 0,-16.90178 10.63646,-34.38638 20.83581,-34.38638
                z
                `
            ]
        ],
        "animation_class" : [
            "animated-pencil-animation-beginning",
            "animated-pencil-animation-ending"
        ]

    },

    "animated-poof-beginning" : {

        "poof" : [
            [
                [0],
                [],
                0,
                false,
                false,
                [0.9, 0.1],
                [(window.innerWidth * 0.5) - 9 * rem, (window.innerHeight * 0.5)],
                `
                M 0 0
                `
            ]
        ],
        "animation_class" : [
            "animated-poof-beginning-animation-beginning",
            "animated-poof-beginning-animation-ending"
        ]

    },

    "animated-poof-ending" : {

        "poof" : [
            [
                [0],
                [],
                0,
                false,
                false,
                [0.9, 0.1],
                [(window.innerWidth * 0.5) + 9 * rem, (window.innerHeight * 0.5)],
                `
                M 0 0
                `
            ]
        ],
        "animation_class" : [
            "animated-poof-ending-animation-beginning",
            "animated-poof-ending-animation-ending"
        ]

    },

    "preview_before_first_launch" : false,
    "time_before_first_launch" : 1000,
    "first_level_animation_speeds_list" : [3000],
    "pause_between_animations_list" : [1000],
    "global_animation_repetition_number" : 1,
    "hasAnimationPageSubElements" : false,
    "animation_page_effect_class_to_activate" : ""

};








const animation_page_2 = {

    "animated-cursor" : {

        "cursor" : [
            [
                [0],
                [],
                0,
                false,
                false,
                [0.9, 0.1],
                [(window.innerWidth * 0.5) - 10 * rem, (window.innerHeight * 0.5) - 10 * rem],
                `
                m 237,210 c 6.13403,10.04346 9.17043,21.89425 13,33 12.46778,36.15656 -1.43854,-0.1648 15,36 2.2284,4.90247 3.59168,10.18336 6,15 3.60555,7.2111 7.81586,14.10848 12,21 1.48814,2.45105 3.71764,4.43528 5,7 0.44721,0.89443 -0.53,2.152 0,3 1.24922,1.99875 3.73457,3.01147 5,5 2.21263,3.477 2.29854,7.82732 6,11 1.47573,1.26491 3.62563,1.62563 5,3 1.65425,1.65425 6.00477,10.33969 8,13 1.57219,2.09626 3.37678,2.37678 4,3 0.2357,0.2357 -0.2357,0.7643 0,1 0.2357,0.2357 0.70186,-0.14907 1,0 2.49738,1.24869 5.05834,4.05834 7,6 3.94351,3.94351 4.48523,2.48523 5,3 0.2357,0.2357 -0.2357,0.7643 0,1 2.06903,2.06903 -0.0809,-3.16176 2,1 0.14907,0.29814 0.0808,1.32338 0,1 -0.41223,-1.64893 -0.66667,-3.33333 -1,-5
                `
            ]
        ],
        "animation_class" : [
            "animated-cursor-animation-beginning",
            "animated-cursor-animation-ending"
        ]

    },

    "animated-context-menu" : {

        "context-menu" : [
            [
                [0],
                [],
                0,
                false,
                false,
                [0.5, 0.1],
                [(window.innerWidth * 0.5) - 8 * rem, (window.innerHeight * 0.5) - 6 * rem],
                `
                M 0 0
                `
            ]
        ],
        "animation_class" : [
            "animated-context-menu-animation-beginning",
            "animated-context-menu-animation-ending"
        ]

    },

    "preview_before_first_launch" : false,
    "time_before_first_launch" : 1000,
    "first_level_animation_speeds_list" : [1000],
    "pause_between_animations_list" : [1000],
    "global_animation_repetition_number" : 1,
    "hasAnimationPageSubElements" : false,
    "animation_page_effect_class_to_activate" : ""

};








const animation_page_3 = {

    "animated-leaf" : {

        "leaf" : [
            [
                [0],
                [],
                0,
                true,
                false,
                [0.9, 0.1],
                [(window.innerWidth * 0.2), (window.innerHeight * 0)],
                `
                m 416,60.8
                c 0,0.853333 -0.85333,2.56 0,2.56 0.92379,0 -0.64,-7.760545 -0.64,3.2 0,2.053869 0.74271,9.394574 0,10.88 -0.26985,0.539695 -1.01015,0.740305 -1.28,1.28 -0.36765,0.735293 -0.0114,3.851363 -0.64,4.48 -0.15085,0.150849 -0.42667,0 -0.64,0 -0.21333,0.213333 -0.47265,0.388971 -0.64,0.64 -0.9334,1.400106 -0.24006,1.360169 -0.64,2.56 -1.54526,4.635787 0.18451,-1.009029 -1.28,1.92 -0.64,1.28 1.28,0 0,1.92 -0.53805,0.807081 -2.0047,0.978798 -2.56,3.2 -0.15522,0.620891 0.20239,1.312843 0,1.92 -0.55037,1.651119 -1.91364,2.864092 -2.56,4.48 -0.60924,1.52309 -1.07936,3.71894 -1.92,5.12 -1.2213,2.03549 -3.10356,3.69534 -4.48,5.76 -0.11834,0.1775 0.15085,0.48915 0,0.64 -0.15085,0.15085 -0.48915,-0.15085 -0.64,0 -0.11793,0.11793 -0.52207,1.80207 -0.64,1.92 -0.59596,0.59596 -1.62602,0.34602 -2.56,1.28 -0.15085,0.15085 0.15085,0.48915 0,0.64 -0.15085,0.15085 -0.52166,-0.1775 -0.64,0 -0.75024,1.12536 -0.89382,2.81382 -1.92,3.84 -0.33731,0.33731 -0.94269,0.30269 -1.28,0.64 -0.76502,0.76502 -1.49366,2.34732 -1.92,3.2 -0.76681,1.53362 -3.32292,2.04292 -4.48,3.2 -0.5439,0.5439 -0.7361,1.3761 -1.28,1.92 -1.35102,1.35102 -3.22941,2.17254 -4.48,3.84 -0.28622,0.38162 -0.30269,0.94269 -0.64,1.28 -0.33731,0.33731 -0.94269,0.30269 -1.28,0.64 -0.15085,0.15085 0,0.42667 0,0.64 -0.21333,0.21333 -0.39864,0.45898 -0.64,0.64 -0.20113,0.15085 -2.91595,1.35191 -3.2,1.92 -0.0954,0.19081 0.15085,0.48915 0,0.64 -0.15085,0.15085 -0.4625,-0.11834 -0.64,0 -0.50206,0.3347 -0.7403,1.01015 -1.28,1.28 -0.38162,0.19081 -0.88385,-0.15846 -1.28,0 -1.09712,0.43885 -4.27857,2.35857 -5.12,3.2 -0.5439,0.5439 -0.7361,1.3761 -1.28,1.92 -0.96125,0.96125 -2.70583,0.90194 -3.84,1.28 -4.26667,1.42222 1.49333,-0.35556 -1.92,1.92 -0.64,0.42667 -1.28,-0.21333 -1.92,0 -4.63579,1.54526 1.00903,-0.18451 -1.92,1.28 -0.57243,0.28622 -1.29911,-0.15522 -1.92,0 -1.15836,-0.38575 -1.19029,1.03676 -1.92,1.28 -0.87422,0.29141 -4.85022,0.45489 -5.76,0 -1.84225,-0.92112 0.55157,-1.32421 -0.64,-1.92 -0.57243,-0.28622 -1.46745,0.45255 -1.92,0 -0.85333,-0.85333 1.35765,-0.61412 -0.64,-1.28 -0.60716,-0.20239 -1.34757,0.28622 -1.92,0 -1.83904,-0.91952 -3.29321,-2.92661 -5.12,-3.84 -1.32379,-0.6619 -1.95562,-3.91124 -2.56,-5.12 -0.384,-0.768 -1.536,-1.152 -1.92,-1.92 -0.19321,-0.38642 0.29585,-1.62415 0,-1.92 -0.15085,-0.15085 -0.48915,0.15085 -0.64,0 -0.3017,-0.3017 0.19081,-0.89838 0,-1.28 -0.26985,-0.5397 -1.01015,-0.7403 -1.28,-1.28 -0.29303,-0.58606 0.0833,-2.86701 0,-3.2 -0.0732,-0.29269 -0.54459,-0.35378 -0.64,-0.64 -0.42323,-1.26968 0.27571,-2.10712 0.64,-3.2 0.27016,-0.81047 -0.0901,-6.35493 0,-6.4 0.76324,-0.38162 1.9566,0.6034 2.56,0 0.21333,-0.21333 -0.50508,-0.37015 -0.64,-0.64 -0.42001,-0.84002 1.29882,-1.26118 0.64,-1.92 -0.064,-0.064 -1.42933,-0.49067 -0.64,-1.28 0.22787,-0.22787 1.89748,-0.61748 1.92,-0.64 0.15085,-0.15085 -0.19081,-0.54459 0,-0.64 0.57243,-0.28622 1.46745,0.45255 1.92,0 0.15085,-0.15085 -0.15085,-0.48915 0,-0.64 0.32,-0.32 1.6,0.32 1.92,0 0.15085,-0.15085 -0.15085,-0.48915 0,-0.64 0.3017,-0.3017 0.89838,0.19081 1.28,0 2.66353,-1.33176 -0.68418,0.0442 0.64,-1.28 0.45255,-0.45255 1.28,0 1.92,0 1.706,0 5.54722,-0.74639 7.04,0 0.5397,0.26985 0.7403,1.01015 1.28,1.28 0.97191,0.48595 1.85175,-0.1365 2.56,1.28 0.0954,0.19081 -0.15085,0.48915 0,0.64 0.42667,0.42667 0.85333,-0.42667 1.28,0 0.15085,0.15085 -0.15085,0.48915 0,0.64 0.15085,0.15085 0.48915,-0.15085 0.64,0 0.33731,0.33731 0.30269,0.94269 0.64,1.28 0.42667,0.42667 0.85333,-0.42667 1.28,0 0.3932,0.3932 0.42281,1.49141 1.28,1.92 0.88279,0.44139 0.57246,-0.77508 1.28,0.64 1.30184,2.60367 -0.6291,2.58181 0,3.84 0.84939,1.69878 3.05516,1.63032 3.84,3.2 0.41839,0.83679 -0.59462,1.30269 0.64,1.92 0.88279,0.44139 0.57246,-0.77508 1.28,0.64 0.19081,0.38162 -0.19081,0.89838 0,1.28 0.26985,0.5397 1.01015,0.7403 1.28,1.28 0.256,0.512 -0.256,1.408 0,1.92 0.59476,1.18952 1.94994,1.97988 2.56,3.2 0.19081,0.38162 -0.38162,1.08919 0,1.28 0.38162,0.19081 0.89838,-0.19081 1.28,0 0.19081,0.0954 -0.0954,0.44919 0,0.64 0.56116,1.12232 1.98267,2.04534 2.56,3.2 0.34386,0.68773 -0.24682,1.81953 0,2.56 0.27186,0.81558 0.93997,1.87995 1.28,2.56 1.33176,2.66353 -0.0442,-0.68418 1.28,0.64 0.8217,0.8217 0.63713,2.23569 1.28,3.2 0.64,0.96 1.28,0.64 1.92,1.92 0.19081,0.38162 -0.10348,0.86607 0,1.28 0.1157,0.46278 0.42667,0.85333 0.64,1.28 0.21333,0.64 0.5077,1.25848 0.64,1.92 0.40739,2.03694 -0.50295,4.38821 0,6.4 0.18655,0.74622 1.03676,1.19029 1.28,1.92 0.28809,0.86428 0.21428,3.83716 0,4.48 -0.0675,0.20239 -0.42667,0 -0.64,0 -0.21333,0.42667 -0.48915,0.82745 -0.64,1.28 -0.55321,1.65963 0.7733,4.21339 0,5.76 -0.0954,0.19081 -0.57254,-0.20239 -0.64,0 -0.17635,0.52906 0.33988,2.52024 0,3.2 -1.46451,2.92903 0.26526,-2.71579 -1.28,1.92 -0.0675,0.20239 0.15085,0.48915 0,0.64 -0.15085,0.15085 -0.48915,-0.15085 -0.64,0 -0.6291,0.6291 -3.58773,5.00319 -3.84,5.76 -0.13492,0.40477 0.13492,0.87523 0,1.28 -0.19081,0.57243 -1.01015,0.7403 -1.28,1.28 -0.0954,0.19081 0,0.42667 0,0.64 -0.21333,0.64 -0.23523,1.3803 -0.64,1.92 -0.28622,0.38162 -0.94269,0.30269 -1.28,0.64 -0.47703,0.47703 -0.26579,1.35868 -0.64,1.92 -1.03488,1.55232 -2.4229,2.9258 -3.2,4.48 -0.52783,1.05566 -6.09458,7.20729 -7.04,7.68 -0.19081,0.0954 -0.48915,-0.15085 -0.64,0 -0.33731,0.33731 -0.30269,0.94269 -0.64,1.28 -0.0397,1.80207 -1.44297,0.16297 -1.92,0.64 -0.33731,0.33731 -0.30269,0.94269 -0.64,1.28 -0.40085,0.40085 -2.8231,1.05386 -3.2,1.28 -0.51741,0.31045 -0.77794,0.9453 -1.28,1.28 -0.1775,0.11834 -0.50673,-0.16659 -0.64,0 -1.21031,1.51288 -2.38936,4.30936 -3.84,5.76 -0.32,0.32 -1.6,-0.32 -1.92,0 -0.15085,0.15085 0.15085,0.48915 0,0.64 -0.96,0.96 -4.8,-0.96 -5.76,0 -0.3017,0.3017 0.19081,0.89838 0,1.28 -0.12533,0.25066 -3.27644,0 -3.84,0 -0.91669,0 -5.17657,0.58343 -5.76,0 -0.33731,-0.33731 -0.24309,-1.01539 -0.64,-1.28 -0.77276,-0.51517 -6.25394,-0.16465 -7.68,-0.64 -0.39057,-0.13019 -1.52943,-1.14981 -1.92,-1.28 -0.12916,-0.043 -2.34707,0.21293 -2.56,0 -0.15085,-0.15085 0.15085,-0.48915 0,-0.64 -0.55379,-0.55379 -3.14788,0.34606 -3.84,0 -0.38162,-0.19081 0.3017,-0.9783 0,-1.28 -0.30792,-0.30792 -4.54765,-0.35382 -5.12,-0.64 -2.66353,-1.33176 0.68418,0.0442 -0.64,-1.28 -0.46641,-0.46641 -2.56876,-0.009 -3.2,-0.64 -0.32,-0.32 0.32,-1.6 0,-1.92 -0.42667,-0.42667 -0.85333,0.42667 -1.28,0 -0.26362,-0.26362 -0.49778,-1.49333 -0.64,-1.92 1.15895,-2.67761 -1.01015,-0.7403 -1.28,-1.28 -0.19081,-0.38162 0.13492,-0.87523 0,-1.28 -0.0954,-0.28622 -0.56683,-0.34731 -0.64,-0.64 -0.33212,-1.32849 0.43774,-3.16678 0,-4.48 -1.61658,-4.84973 0.2311,0.2311 -1.28,-1.28 -0.24937,-0.24937 0,-2.16944 0,-2.56 0,-0.42667 0.3017,-0.9783 0,-1.28 -0.15085,-0.15085 -0.64,0.21333 -0.64,0 0,-0.3017 0.38897,-0.47265 0.64,-0.64 3.07498,-2.04999 0.23401,-0.87401 1.28,-1.92 0.15085,-0.15085 0.48915,0.15085 0.64,0 0.15085,-0.15085 -0.15085,-0.48915 0,-0.64 0.3017,-0.3017 0.9783,0.3017 1.28,0 0.42478,-0.42478 -0.42478,-0.85522 0,-1.28 0.064,-0.064 1.856,-0.064 1.92,0 0.42478,0.42478 -0.42478,0.85522 0,1.28 0.3017,0.3017 0.9783,-0.3017 1.28,0 0.22787,0.22787 0.61748,1.89748 0.64,1.92 0.3017,0.3017 0.87523,-0.13492 1.28,0 1.19398,0.39799 1.59429,0.79715 2.56,1.28 0.38162,0.19081 0.9783,-0.3017 1.28,0 0.15085,0.15085 -0.15085,0.48915 0,0.64 1.32418,1.32418 -0.0518,-2.02353 1.28,0.64 0.0954,0.19081 -0.15085,0.48915 0,0.64 0.0225,0.0225 1.69213,0.41213 1.92,0.64 1.32418,1.32418 -2.02353,-0.0518 0.64,1.28 0.38162,0.19081 0.9783,-0.3017 1.28,0 0.21333,0.21333 0.42667,1.70667 0.64,1.92 0.43449,0.43449 3.27222,1.35222 3.84,1.92 0.15085,0.15085 -0.15085,0.48915 0,0.64 0.27247,0.27247 2.11066,1.02131 2.56,1.92 0.7321,1.46419 1.56102,2.98153 2.56,4.48 1.10748,1.66123 2.69354,2.95139 3.84,4.48 1.30507,1.7401 0.85117,4.26233 1.28,5.12 1.46451,2.92903 -0.26526,-2.71579 1.28,1.92 0.24797,0.74391 0.30113,1.88225 0.64,2.56 0.26985,0.5397 1.08919,0.70757 1.28,1.28 0.15389,0.46166 0.28043,2.84043 0.64,3.2 0.3017,0.3017 1.08919,-0.38162 1.28,0 0.11721,0.23441 -0.26923,2.29077 0,2.56 0.15085,0.15085 0.48915,-0.15085 0.64,0 0.55353,0.55353 -0.5223,7.2754 0,8.32 0.19392,0.38784 1.71732,1.04536 1.28,1.92 -0.40789,0.81579 -1.638,1.714 -1.92,2.56 -0.47735,1.43204 0.67209,3.77583 0,5.12 -1.33176,2.66353 0.0442,-0.68418 -1.28,0.64 -0.25705,0.25705 0.12066,1.55803 0,1.92 -0.21333,0.64 -0.26579,1.35868 -0.64,1.92 -0.3347,0.50206 -1.11423,0.69982 -1.28,1.28 -0.29304,1.02563 0.17536,2.14785 0,3.2 -0.30137,1.80822 -5.33035,5.54071 -6.4,7.68 -1.31082,2.62164 -2.26631,5.69718 -3.84,8.32 -0.27109,0.45182 -2.96395,4.24395 -3.2,4.48 -0.15085,0.15085 -0.48915,-0.15085 -0.64,0 -4.02963,4.02963 0.60514,0.16984 -1.92,3.2 -0.77257,0.92709 -1.78743,1.63291 -2.56,2.56 -0.61077,0.73293 -0.75079,1.76618 -1.28,2.56 -0.74004,1.11006 -5.86974,7.92991 -7.04,8.32 -0.40477,0.13492 -0.92499,-0.23667 -1.28,0 -1.80207,0.0397 -0.16297,1.44297 -0.64,1.92 -0.15085,0.15085 -0.44919,-0.0954 -0.64,0 -2.35728,1.17864 -3.6337,2.64674 -6.4,3.2 -1.41263,0.28253 -3.1273,-0.4509 -4.48,0 -2.25884,0.75295 -3.97368,2.94684 -5.76,3.84 -0.38162,0.19081 -0.88385,-0.15846 -1.28,0 -2.14126,0.8565 -3.98847,2.15808 -6.4,2.56 -7.50621,1.25104 -14.00066,1.28 -21.76,1.28 -7.92501,0 -15.96563,0.13716 -23.68,-1.92 -1.11004,-0.29601 -2.09962,-0.94988 -3.2,-1.28 -9.30008,-2.79002 2.01668,0.91534 -5.76,-0.64 -1.96923,-0.39385 -3.79077,-1.52615 -5.76,-1.92 -1.4792,-0.29584 -3.02955,-0.22558 -4.48,-0.64 -3.16734,-0.90495 -6.55514,-2.53506 -9.6,-3.84 -2.91769,-1.25044 -5.79543,-0.70286 -8.96,-1.92 -2.32205,-0.89309 -4.4097,-2.34728 -6.4,-3.84 -0.72408,-0.54306 -1.15248,-1.4403 -1.92,-1.92 -1.36237,-1.41899 -3.55703,-0.98222 -5.12,-1.92 -1.03482,-0.62089 -1.61765,-1.80612 -2.56,-2.56 -1.24258,-0.99406 -2.60694,-1.6352 -3.84,-2.56 -4.38152,-3.28614 3.35215,1.29509 -3.84,-3.2 -1.96824,-1.23015 -3.27864,-1.81898 -5.12,-3.2 -0.21333,-0.21333 -0.42667,-0.42667 -0.64,-0.64 0,-0.21333 0.15085,-0.48915 0,-0.64 -0.3017,-0.3017 -0.85333,0 -1.28,0
                `
            ],
            [
                [0],
                [],
                0,
                true,
                false,
                [0.9, 0.1],
                [(window.innerWidth * 0.2 - (window.innerWidth * 0.2)), (window.innerHeight * 0.05)],
                `
                m 416,60.8
                c 0,0.853333 -0.85333,2.56 0,2.56 0.92379,0 -0.64,-7.760545 -0.64,3.2 0,2.053869 0.74271,9.394574 0,10.88 -0.26985,0.539695 -1.01015,0.740305 -1.28,1.28 -0.36765,0.735293 -0.0114,3.851363 -0.64,4.48 -0.15085,0.150849 -0.42667,0 -0.64,0 -0.21333,0.213333 -0.47265,0.388971 -0.64,0.64 -0.9334,1.400106 -0.24006,1.360169 -0.64,2.56 -1.54526,4.635787 0.18451,-1.009029 -1.28,1.92 -0.64,1.28 1.28,0 0,1.92 -0.53805,0.807081 -2.0047,0.978798 -2.56,3.2 -0.15522,0.620891 0.20239,1.312843 0,1.92 -0.55037,1.651119 -1.91364,2.864092 -2.56,4.48 -0.60924,1.52309 -1.07936,3.71894 -1.92,5.12 -1.2213,2.03549 -3.10356,3.69534 -4.48,5.76 -0.11834,0.1775 0.15085,0.48915 0,0.64 -0.15085,0.15085 -0.48915,-0.15085 -0.64,0 -0.11793,0.11793 -0.52207,1.80207 -0.64,1.92 -0.59596,0.59596 -1.62602,0.34602 -2.56,1.28 -0.15085,0.15085 0.15085,0.48915 0,0.64 -0.15085,0.15085 -0.52166,-0.1775 -0.64,0 -0.75024,1.12536 -0.89382,2.81382 -1.92,3.84 -0.33731,0.33731 -0.94269,0.30269 -1.28,0.64 -0.76502,0.76502 -1.49366,2.34732 -1.92,3.2 -0.76681,1.53362 -3.32292,2.04292 -4.48,3.2 -0.5439,0.5439 -0.7361,1.3761 -1.28,1.92 -1.35102,1.35102 -3.22941,2.17254 -4.48,3.84 -0.28622,0.38162 -0.30269,0.94269 -0.64,1.28 -0.33731,0.33731 -0.94269,0.30269 -1.28,0.64 -0.15085,0.15085 0,0.42667 0,0.64 -0.21333,0.21333 -0.39864,0.45898 -0.64,0.64 -0.20113,0.15085 -2.91595,1.35191 -3.2,1.92 -0.0954,0.19081 0.15085,0.48915 0,0.64 -0.15085,0.15085 -0.4625,-0.11834 -0.64,0 -0.50206,0.3347 -0.7403,1.01015 -1.28,1.28 -0.38162,0.19081 -0.88385,-0.15846 -1.28,0 -1.09712,0.43885 -4.27857,2.35857 -5.12,3.2 -0.5439,0.5439 -0.7361,1.3761 -1.28,1.92 -0.96125,0.96125 -2.70583,0.90194 -3.84,1.28 -4.26667,1.42222 1.49333,-0.35556 -1.92,1.92 -0.64,0.42667 -1.28,-0.21333 -1.92,0 -4.63579,1.54526 1.00903,-0.18451 -1.92,1.28 -0.57243,0.28622 -1.29911,-0.15522 -1.92,0 -1.15836,-0.38575 -1.19029,1.03676 -1.92,1.28 -0.87422,0.29141 -4.85022,0.45489 -5.76,0 -1.84225,-0.92112 0.55157,-1.32421 -0.64,-1.92 -0.57243,-0.28622 -1.46745,0.45255 -1.92,0 -0.85333,-0.85333 1.35765,-0.61412 -0.64,-1.28 -0.60716,-0.20239 -1.34757,0.28622 -1.92,0 -1.83904,-0.91952 -3.29321,-2.92661 -5.12,-3.84 -1.32379,-0.6619 -1.95562,-3.91124 -2.56,-5.12 -0.384,-0.768 -1.536,-1.152 -1.92,-1.92 -0.19321,-0.38642 0.29585,-1.62415 0,-1.92 -0.15085,-0.15085 -0.48915,0.15085 -0.64,0 -0.3017,-0.3017 0.19081,-0.89838 0,-1.28 -0.26985,-0.5397 -1.01015,-0.7403 -1.28,-1.28 -0.29303,-0.58606 0.0833,-2.86701 0,-3.2 -0.0732,-0.29269 -0.54459,-0.35378 -0.64,-0.64 -0.42323,-1.26968 0.27571,-2.10712 0.64,-3.2 0.27016,-0.81047 -0.0901,-6.35493 0,-6.4 0.76324,-0.38162 1.9566,0.6034 2.56,0 0.21333,-0.21333 -0.50508,-0.37015 -0.64,-0.64 -0.42001,-0.84002 1.29882,-1.26118 0.64,-1.92 -0.064,-0.064 -1.42933,-0.49067 -0.64,-1.28 0.22787,-0.22787 1.89748,-0.61748 1.92,-0.64 0.15085,-0.15085 -0.19081,-0.54459 0,-0.64 0.57243,-0.28622 1.46745,0.45255 1.92,0 0.15085,-0.15085 -0.15085,-0.48915 0,-0.64 0.32,-0.32 1.6,0.32 1.92,0 0.15085,-0.15085 -0.15085,-0.48915 0,-0.64 0.3017,-0.3017 0.89838,0.19081 1.28,0 2.66353,-1.33176 -0.68418,0.0442 0.64,-1.28 0.45255,-0.45255 1.28,0 1.92,0 1.706,0 5.54722,-0.74639 7.04,0 0.5397,0.26985 0.7403,1.01015 1.28,1.28 0.97191,0.48595 1.85175,-0.1365 2.56,1.28 0.0954,0.19081 -0.15085,0.48915 0,0.64 0.42667,0.42667 0.85333,-0.42667 1.28,0 0.15085,0.15085 -0.15085,0.48915 0,0.64 0.15085,0.15085 0.48915,-0.15085 0.64,0 0.33731,0.33731 0.30269,0.94269 0.64,1.28 0.42667,0.42667 0.85333,-0.42667 1.28,0 0.3932,0.3932 0.42281,1.49141 1.28,1.92 0.88279,0.44139 0.57246,-0.77508 1.28,0.64 1.30184,2.60367 -0.6291,2.58181 0,3.84 0.84939,1.69878 3.05516,1.63032 3.84,3.2 0.41839,0.83679 -0.59462,1.30269 0.64,1.92 0.88279,0.44139 0.57246,-0.77508 1.28,0.64 0.19081,0.38162 -0.19081,0.89838 0,1.28 0.26985,0.5397 1.01015,0.7403 1.28,1.28 0.256,0.512 -0.256,1.408 0,1.92 0.59476,1.18952 1.94994,1.97988 2.56,3.2 0.19081,0.38162 -0.38162,1.08919 0,1.28 0.38162,0.19081 0.89838,-0.19081 1.28,0 0.19081,0.0954 -0.0954,0.44919 0,0.64 0.56116,1.12232 1.98267,2.04534 2.56,3.2 0.34386,0.68773 -0.24682,1.81953 0,2.56 0.27186,0.81558 0.93997,1.87995 1.28,2.56 1.33176,2.66353 -0.0442,-0.68418 1.28,0.64 0.8217,0.8217 0.63713,2.23569 1.28,3.2 0.64,0.96 1.28,0.64 1.92,1.92 0.19081,0.38162 -0.10348,0.86607 0,1.28 0.1157,0.46278 0.42667,0.85333 0.64,1.28 0.21333,0.64 0.5077,1.25848 0.64,1.92 0.40739,2.03694 -0.50295,4.38821 0,6.4 0.18655,0.74622 1.03676,1.19029 1.28,1.92 0.28809,0.86428 0.21428,3.83716 0,4.48 -0.0675,0.20239 -0.42667,0 -0.64,0 -0.21333,0.42667 -0.48915,0.82745 -0.64,1.28 -0.55321,1.65963 0.7733,4.21339 0,5.76 -0.0954,0.19081 -0.57254,-0.20239 -0.64,0 -0.17635,0.52906 0.33988,2.52024 0,3.2 -1.46451,2.92903 0.26526,-2.71579 -1.28,1.92 -0.0675,0.20239 0.15085,0.48915 0,0.64 -0.15085,0.15085 -0.48915,-0.15085 -0.64,0 -0.6291,0.6291 -3.58773,5.00319 -3.84,5.76 -0.13492,0.40477 0.13492,0.87523 0,1.28 -0.19081,0.57243 -1.01015,0.7403 -1.28,1.28 -0.0954,0.19081 0,0.42667 0,0.64 -0.21333,0.64 -0.23523,1.3803 -0.64,1.92 -0.28622,0.38162 -0.94269,0.30269 -1.28,0.64 -0.47703,0.47703 -0.26579,1.35868 -0.64,1.92 -1.03488,1.55232 -2.4229,2.9258 -3.2,4.48 -0.52783,1.05566 -6.09458,7.20729 -7.04,7.68 -0.19081,0.0954 -0.48915,-0.15085 -0.64,0 -0.33731,0.33731 -0.30269,0.94269 -0.64,1.28 -0.0397,1.80207 -1.44297,0.16297 -1.92,0.64 -0.33731,0.33731 -0.30269,0.94269 -0.64,1.28 -0.40085,0.40085 -2.8231,1.05386 -3.2,1.28 -0.51741,0.31045 -0.77794,0.9453 -1.28,1.28 -0.1775,0.11834 -0.50673,-0.16659 -0.64,0 -1.21031,1.51288 -2.38936,4.30936 -3.84,5.76 -0.32,0.32 -1.6,-0.32 -1.92,0 -0.15085,0.15085 0.15085,0.48915 0,0.64 -0.96,0.96 -4.8,-0.96 -5.76,0 -0.3017,0.3017 0.19081,0.89838 0,1.28 -0.12533,0.25066 -3.27644,0 -3.84,0 -0.91669,0 -5.17657,0.58343 -5.76,0 -0.33731,-0.33731 -0.24309,-1.01539 -0.64,-1.28 -0.77276,-0.51517 -6.25394,-0.16465 -7.68,-0.64 -0.39057,-0.13019 -1.52943,-1.14981 -1.92,-1.28 -0.12916,-0.043 -2.34707,0.21293 -2.56,0 -0.15085,-0.15085 0.15085,-0.48915 0,-0.64 -0.55379,-0.55379 -3.14788,0.34606 -3.84,0 -0.38162,-0.19081 0.3017,-0.9783 0,-1.28 -0.30792,-0.30792 -4.54765,-0.35382 -5.12,-0.64 -2.66353,-1.33176 0.68418,0.0442 -0.64,-1.28 -0.46641,-0.46641 -2.56876,-0.009 -3.2,-0.64 -0.32,-0.32 0.32,-1.6 0,-1.92 -0.42667,-0.42667 -0.85333,0.42667 -1.28,0 -0.26362,-0.26362 -0.49778,-1.49333 -0.64,-1.92 1.15895,-2.67761 -1.01015,-0.7403 -1.28,-1.28 -0.19081,-0.38162 0.13492,-0.87523 0,-1.28 -0.0954,-0.28622 -0.56683,-0.34731 -0.64,-0.64 -0.33212,-1.32849 0.43774,-3.16678 0,-4.48 -1.61658,-4.84973 0.2311,0.2311 -1.28,-1.28 -0.24937,-0.24937 0,-2.16944 0,-2.56 0,-0.42667 0.3017,-0.9783 0,-1.28 -0.15085,-0.15085 -0.64,0.21333 -0.64,0 0,-0.3017 0.38897,-0.47265 0.64,-0.64 3.07498,-2.04999 0.23401,-0.87401 1.28,-1.92 0.15085,-0.15085 0.48915,0.15085 0.64,0 0.15085,-0.15085 -0.15085,-0.48915 0,-0.64 0.3017,-0.3017 0.9783,0.3017 1.28,0 0.42478,-0.42478 -0.42478,-0.85522 0,-1.28 0.064,-0.064 1.856,-0.064 1.92,0 0.42478,0.42478 -0.42478,0.85522 0,1.28 0.3017,0.3017 0.9783,-0.3017 1.28,0 0.22787,0.22787 0.61748,1.89748 0.64,1.92 0.3017,0.3017 0.87523,-0.13492 1.28,0 1.19398,0.39799 1.59429,0.79715 2.56,1.28 0.38162,0.19081 0.9783,-0.3017 1.28,0 0.15085,0.15085 -0.15085,0.48915 0,0.64 1.32418,1.32418 -0.0518,-2.02353 1.28,0.64 0.0954,0.19081 -0.15085,0.48915 0,0.64 0.0225,0.0225 1.69213,0.41213 1.92,0.64 1.32418,1.32418 -2.02353,-0.0518 0.64,1.28 0.38162,0.19081 0.9783,-0.3017 1.28,0 0.21333,0.21333 0.42667,1.70667 0.64,1.92 0.43449,0.43449 3.27222,1.35222 3.84,1.92 0.15085,0.15085 -0.15085,0.48915 0,0.64 0.27247,0.27247 2.11066,1.02131 2.56,1.92 0.7321,1.46419 1.56102,2.98153 2.56,4.48 1.10748,1.66123 2.69354,2.95139 3.84,4.48 1.30507,1.7401 0.85117,4.26233 1.28,5.12 1.46451,2.92903 -0.26526,-2.71579 1.28,1.92 0.24797,0.74391 0.30113,1.88225 0.64,2.56 0.26985,0.5397 1.08919,0.70757 1.28,1.28 0.15389,0.46166 0.28043,2.84043 0.64,3.2 0.3017,0.3017 1.08919,-0.38162 1.28,0 0.11721,0.23441 -0.26923,2.29077 0,2.56 0.15085,0.15085 0.48915,-0.15085 0.64,0 0.55353,0.55353 -0.5223,7.2754 0,8.32 0.19392,0.38784 1.71732,1.04536 1.28,1.92 -0.40789,0.81579 -1.638,1.714 -1.92,2.56 -0.47735,1.43204 0.67209,3.77583 0,5.12 -1.33176,2.66353 0.0442,-0.68418 -1.28,0.64 -0.25705,0.25705 0.12066,1.55803 0,1.92 -0.21333,0.64 -0.26579,1.35868 -0.64,1.92 -0.3347,0.50206 -1.11423,0.69982 -1.28,1.28 -0.29304,1.02563 0.17536,2.14785 0,3.2 -0.30137,1.80822 -5.33035,5.54071 -6.4,7.68 -1.31082,2.62164 -2.26631,5.69718 -3.84,8.32 -0.27109,0.45182 -2.96395,4.24395 -3.2,4.48 -0.15085,0.15085 -0.48915,-0.15085 -0.64,0 -4.02963,4.02963 0.60514,0.16984 -1.92,3.2 -0.77257,0.92709 -1.78743,1.63291 -2.56,2.56 -0.61077,0.73293 -0.75079,1.76618 -1.28,2.56 -0.74004,1.11006 -5.86974,7.92991 -7.04,8.32 -0.40477,0.13492 -0.92499,-0.23667 -1.28,0 -1.80207,0.0397 -0.16297,1.44297 -0.64,1.92 -0.15085,0.15085 -0.44919,-0.0954 -0.64,0 -2.35728,1.17864 -3.6337,2.64674 -6.4,3.2 -1.41263,0.28253 -3.1273,-0.4509 -4.48,0 -2.25884,0.75295 -3.97368,2.94684 -5.76,3.84 -0.38162,0.19081 -0.88385,-0.15846 -1.28,0 -2.14126,0.8565 -3.98847,2.15808 -6.4,2.56 -7.50621,1.25104 -14.00066,1.28 -21.76,1.28 -7.92501,0 -15.96563,0.13716 -23.68,-1.92 -1.11004,-0.29601 -2.09962,-0.94988 -3.2,-1.28 -9.30008,-2.79002 2.01668,0.91534 -5.76,-0.64 -1.96923,-0.39385 -3.79077,-1.52615 -5.76,-1.92 -1.4792,-0.29584 -3.02955,-0.22558 -4.48,-0.64 -3.16734,-0.90495 -6.55514,-2.53506 -9.6,-3.84 -2.91769,-1.25044 -5.79543,-0.70286 -8.96,-1.92 -2.32205,-0.89309 -4.4097,-2.34728 -6.4,-3.84 -0.72408,-0.54306 -1.15248,-1.4403 -1.92,-1.92 -1.36237,-1.41899 -3.55703,-0.98222 -5.12,-1.92 -1.03482,-0.62089 -1.61765,-1.80612 -2.56,-2.56 -1.24258,-0.99406 -2.60694,-1.6352 -3.84,-2.56 -4.38152,-3.28614 3.35215,1.29509 -3.84,-3.2 -1.96824,-1.23015 -3.27864,-1.81898 -5.12,-3.2 -0.21333,-0.21333 -0.42667,-0.42667 -0.64,-0.64 0,-0.21333 0.15085,-0.48915 0,-0.64 -0.3017,-0.3017 -0.85333,0 -1.28,0
                `
            ],
            [
                [0],
                [],
                0,
                true,
                false,
                [0.9, 0.1],
                [(window.innerWidth * 0.2), (window.innerHeight - window.innerHeight * 0.05)],
                `
                m 306.56,490.88
                c -0.42667,-0.85333 -0.42667,-2.98667 -1.28,-2.56 -0.85333,0.42667 1.70667,3.41333 1.28,2.56 -0.85333,-1.70667 -1.78504,-3.37635 -2.56,-5.12 -0.82379,-1.85352 0.0942,-6.21168 -0.64,-7.68 -1.46451,-2.92903 0.26526,2.71579 -1.28,-1.92 -0.53975,-1.61926 -0.3548,-14.866 0,-16.64 0.0935,-0.46776 0.42667,-0.85333 0.64,-1.28 0.21333,-1.06667 0.50508,-2.12061 0.64,-3.2 0.3564,-2.85122 -0.0891,-3.48367 0.64,-6.4 0.20696,-0.82785 -0.26985,-1.75046 0,-2.56 0.19081,-0.57243 1.01015,-0.7403 1.28,-1.28 0.43766,-0.87533 0.32162,-4.48647 0.64,-5.76 0.51546,-2.06185 2.70056,-6.80075 3.84,-8.32 0.72408,-0.96544 1.89059,-1.55589 2.56,-2.56 1.08913,-1.6337 2.10878,-3.48316 3.2,-5.12 0.37421,-0.56132 0.16297,-1.44297 0.64,-1.92 0.39205,-0.39205 1.67495,-0.54484 1.92,-1.28 0.13492,-0.40477 -0.13492,-0.87523 0,-1.28 0.30256,-0.90769 1.5538,-0.9138 1.92,-1.28 0.81935,-0.81935 0.67267,-3.21633 1.92,-3.84 0.99251,-0.49625 1.29496,0.20336 2.56,-0.64 0.50206,-0.3347 0.7403,-1.01015 1.28,-1.28 1.57629,-0.78814 -0.57775,1.85775 1.92,-0.64 0.15085,-0.15085 -0.15085,-0.48915 0,-0.64 0.15085,-0.15085 0.44919,0.0954 0.64,0 0.768,-0.384 1.152,-1.536 1.92,-1.92 0.71816,-0.35908 1.81866,-0.26933 2.56,-0.64 0.5397,-0.26985 0.7403,-1.01015 1.28,-1.28 0.77553,-0.38776 2.3057,-0.9819 3.2,-1.28 1.536,-0.512 3.584,0.512 5.12,0 2.5075,-0.83583 3.81994,-0.64501 6.4,0 0.20696,0.0517 0.48915,-0.15085 0.64,0 0.15085,0.15085 -0.0954,0.44919 0,0.64 1.33176,2.66353 -0.0442,-0.68418 1.28,0.64 0.26056,0.26056 1.07516,2.15031 1.28,2.56 0.28622,0.57243 -0.20239,1.31284 0,1.92 0.19081,0.57243 1.01015,0.7403 1.28,1.28 0.69069,1.38139 -0.45358,1.73358 -0.64,1.92 -1.32418,1.32418 2.02353,-0.0518 -0.64,1.28 -0.67142,0.33571 -2.7135,0.1535 -3.2,0.64 -0.33731,0.33731 -0.30269,0.94269 -0.64,1.28 -0.98619,0.98619 -3.17246,0.30623 -3.84,0.64 -0.5397,0.26985 -0.77794,0.9453 -1.28,1.28 -0.28641,0.19094 -1.56287,0 -1.92,0 -3.2153,0 -6.26809,-0.37617 -7.68,-3.2 -0.58912,-1.17825 -1.33088,-0.10175 -1.92,-1.28 -0.19081,-0.38162 0.3017,-0.9783 0,-1.28 -1.32418,-1.32418 0.0518,2.02353 -1.28,-0.64 -0.19321,-0.38642 0.29585,-1.62415 0,-1.92 -0.15085,-0.15085 -0.42667,0 -0.64,0 -0.42667,-0.42667 -0.9453,-0.77794 -1.28,-1.28 -0.67969,-1.01954 0.54821,-3.38357 0,-4.48 -0.26985,-0.5397 -1.28,-0.6766 -1.28,-1.28 0,-0.95406 0.9783,-1.6549 1.28,-2.56 0.68041,-2.04122 0,-5.50919 0,-7.68 0,-0.88978 0.64,-1.868 0.64,-2.56 0,-1.37254 -0.95478,-3.1791 -1.28,-4.48 -0.42675,-1.70701 -0.33354,-9.85232 0,-11.52 -0.47537,-1.18446 1.09345,-1.17378 1.28,-1.92 0.2124,-0.84959 0,-4.45944 0,-5.12 0,-2.78969 0.7712,-6.9008 0,-9.6 -0.2621,-0.91735 -0.92567,-1.67418 -1.28,-2.56 -0.50806,-1.27014 -0.14919,-3.25296 -0.64,-4.48 -0.7235,-1.80874 -2.36014,-4.72028 -3.2,-6.4 -0.30981,-0.61962 -0.27044,-2.00566 -0.64,-2.56 -1.23875,-1.85812 -2.64736,-3.25824 -4.48,-4.48 -1.14807,-0.76538 -1.63507,-2.5063 -2.56,-3.2 -0.5397,-0.40477 -1.3166,-0.3383 -1.92,-0.64 -0.80954,-0.40477 -1.19592,-1.37694 -1.92,-1.92 -1.07139,-0.80354 -2.05341,-0.59205 -3.2,-1.28 -2.86675,-1.72005 -6.30627,-3.35085 -8.96,-5.12 -0.50206,-0.3347 -0.71976,-1.0559 -1.28,-1.28 -0.14531,-0.0581 -6.88005,-1.24001 -7.04,-1.28 -2.1181,-0.52953 -5.07574,-1.1834 -7.04,-1.92 -0.72021,-0.27008 -1.20583,-0.99433 -1.92,-1.28 -2.17546,-0.87018 -5.35311,0.46538 -7.68,0 -2.20578,-0.44116 -3.19406,-2.55802 -5.12,-3.2 -1.08105,-0.36035 -5.3974,0.7787 -6.4,1.28 -0.768,0.384 -1.152,1.536 -1.92,1.92 -1.29915,0.64958 -1.85679,-0.18963 -2.56,1.92 -0.51836,1.55508 -0.3942,6.10321 0,7.68 1.07772,4.31087 0.01,0.01 1.28,1.28 0.3017,0.3017 -0.19081,0.89838 0,1.28 0.58912,1.17825 1.33088,0.10175 1.92,1.28 0.19081,0.38162 -0.19081,0.89838 0,1.28 0.50793,1.01585 2.13766,1.49766 2.56,1.92 0.33731,0.33731 0.30269,0.94269 0.64,1.28 0.15085,0.15085 0.4625,-0.11834 0.64,0 1.46169,0.97446 1.47047,2.11047 2.56,3.2 0.82962,0.82962 2.80401,2.042 3.84,2.56 0.71816,0.35908 1.81866,0.26933 2.56,0.64 1.62595,0.81297 -0.65544,0.76491 1.92,1.28 2.66667,0.53333 1.06667,-0.35556 3.2,0 5.31052,0.88509 11.49002,1.28749 16.64,0 0.82785,-0.20696 1.73215,0.20696 2.56,0 1.35903,-0.33976 1.81737,-1.68956 3.2,-1.92 5.83251,-0.97208 -1.06174,1.40652 5.76,-0.64 1.10038,-0.33012 2.08547,-1.00137 3.2,-1.28 0.62089,-0.15522 1.28643,0.0905 1.92,0 2.1733,-0.31047 3.18768,-1.36791 5.12,-1.92 1.70398,-0.48685 3.50608,-0.47304 5.12,-1.28 1.12232,-0.56116 2.04534,-1.98267 3.2,-2.56 2.61261,-1.30631 0.78924,-0.14924 2.56,-1.92 0.15085,-0.15085 0.54459,0.19081 0.64,0 0.19081,-0.38162 -0.23667,-0.92499 0,-1.28 0.50294,-0.75442 2.05275,-0.90551 2.56,-1.92 0.19081,-0.38162 -0.23667,-0.92499 0,-1.28 0.50206,-0.75309 1.63378,-1.06135 1.92,-1.92 0.71225,-2.13676 0.31606,-7.04788 -0.64,-8.96 -0.73627,-1.47254 -3.32576,-2.29729 -3.84,-3.84 -0.13492,-0.40477 0.3017,-0.9783 0,-1.28 -0.3017,-0.3017 -0.89838,0.19081 -1.28,0 -0.6034,-0.3017 -0.16297,-1.44297 -0.64,-1.92 -0.15085,-0.15085 -0.44919,0.0954 -0.64,0 -0.34531,-0.17265 -3.57917,-2.93917 -3.84,-3.2 -0.15085,-0.15085 0.15085,-0.48915 0,-0.64 -1.33276,-1.33276 -3.26068,-2.21424 -4.48,-3.84 -0.28622,-0.38162 -0.24309,-1.01539 -0.64,-1.28 -0.35501,-0.23667 -0.87523,0.13492 -1.28,0 -0.85865,-0.28622 -1.16691,-1.41794 -1.92,-1.92 -0.73187,-0.48791 -1.77327,-0.24663 -2.56,-0.64 -4.11302,-2.05651 -7.5827,-4.61567 -12.16,-5.76 -1.87414,-0.46853 -3.90251,-0.10929 -5.76,-0.64 -0.73959,-0.21131 -1.23202,-0.93601 -1.92,-1.28 -2.72078,-1.36039 -6.69159,-1.1929 -9.6,-1.92 -0.46278,-0.1157 -0.81224,-0.54645 -1.28,-0.64 -0.82051,-0.1641 -1.73949,0.1641 -2.56,0 -2.67188,-0.53438 -5.73011,-1.0567 -8.32,-1.92 -2.44695,-0.81565 -5.08629,-2.18947 -7.68,-2.56 -4.27948,-0.61135 -9.12254,0 -13.44,0 -9.38667,0 -18.77333,0 -28.16,0 -7.04,0 -14.08,0 -21.12,0 -5.74424,0 -12.20993,-0.76134 -17.92,0 -3.6,0.48 -4.6,1.36 -7.68,1.92 -2.10104,1.3276 -4.79511,0.3193 -7.04,0.64 -2.27909,0.32558 -8.72474,3.40237 -10.88,4.48 -0.26985,0.13492 -0.34416,0.58083 -0.64,0.64 -2.48889,0.49778 -2.24,-0.37333 -4.48,0 -1.33088,0.22181 -2.71737,0.53158 -3.84,1.28 -0.1775,0.11834 0.15085,0.48915 0,0.64 -0.50248,0.50248 -2.4864,1.92 -3.2,1.92
                `
            ],
            [
                [0],
                [],
                0,
                true,
                false,
                [0.9, 0.1],
                [(window.innerWidth * 0.2 - (window.innerWidth * 0.2)), (window.innerHeight - window.innerHeight * 0.1)],
                `
                m 306.56,490.88
                c -0.42667,-0.85333 -0.42667,-2.98667 -1.28,-2.56 -0.85333,0.42667 1.70667,3.41333 1.28,2.56 -0.85333,-1.70667 -1.78504,-3.37635 -2.56,-5.12 -0.82379,-1.85352 0.0942,-6.21168 -0.64,-7.68 -1.46451,-2.92903 0.26526,2.71579 -1.28,-1.92 -0.53975,-1.61926 -0.3548,-14.866 0,-16.64 0.0935,-0.46776 0.42667,-0.85333 0.64,-1.28 0.21333,-1.06667 0.50508,-2.12061 0.64,-3.2 0.3564,-2.85122 -0.0891,-3.48367 0.64,-6.4 0.20696,-0.82785 -0.26985,-1.75046 0,-2.56 0.19081,-0.57243 1.01015,-0.7403 1.28,-1.28 0.43766,-0.87533 0.32162,-4.48647 0.64,-5.76 0.51546,-2.06185 2.70056,-6.80075 3.84,-8.32 0.72408,-0.96544 1.89059,-1.55589 2.56,-2.56 1.08913,-1.6337 2.10878,-3.48316 3.2,-5.12 0.37421,-0.56132 0.16297,-1.44297 0.64,-1.92 0.39205,-0.39205 1.67495,-0.54484 1.92,-1.28 0.13492,-0.40477 -0.13492,-0.87523 0,-1.28 0.30256,-0.90769 1.5538,-0.9138 1.92,-1.28 0.81935,-0.81935 0.67267,-3.21633 1.92,-3.84 0.99251,-0.49625 1.29496,0.20336 2.56,-0.64 0.50206,-0.3347 0.7403,-1.01015 1.28,-1.28 1.57629,-0.78814 -0.57775,1.85775 1.92,-0.64 0.15085,-0.15085 -0.15085,-0.48915 0,-0.64 0.15085,-0.15085 0.44919,0.0954 0.64,0 0.768,-0.384 1.152,-1.536 1.92,-1.92 0.71816,-0.35908 1.81866,-0.26933 2.56,-0.64 0.5397,-0.26985 0.7403,-1.01015 1.28,-1.28 0.77553,-0.38776 2.3057,-0.9819 3.2,-1.28 1.536,-0.512 3.584,0.512 5.12,0 2.5075,-0.83583 3.81994,-0.64501 6.4,0 0.20696,0.0517 0.48915,-0.15085 0.64,0 0.15085,0.15085 -0.0954,0.44919 0,0.64 1.33176,2.66353 -0.0442,-0.68418 1.28,0.64 0.26056,0.26056 1.07516,2.15031 1.28,2.56 0.28622,0.57243 -0.20239,1.31284 0,1.92 0.19081,0.57243 1.01015,0.7403 1.28,1.28 0.69069,1.38139 -0.45358,1.73358 -0.64,1.92 -1.32418,1.32418 2.02353,-0.0518 -0.64,1.28 -0.67142,0.33571 -2.7135,0.1535 -3.2,0.64 -0.33731,0.33731 -0.30269,0.94269 -0.64,1.28 -0.98619,0.98619 -3.17246,0.30623 -3.84,0.64 -0.5397,0.26985 -0.77794,0.9453 -1.28,1.28 -0.28641,0.19094 -1.56287,0 -1.92,0 -3.2153,0 -6.26809,-0.37617 -7.68,-3.2 -0.58912,-1.17825 -1.33088,-0.10175 -1.92,-1.28 -0.19081,-0.38162 0.3017,-0.9783 0,-1.28 -1.32418,-1.32418 0.0518,2.02353 -1.28,-0.64 -0.19321,-0.38642 0.29585,-1.62415 0,-1.92 -0.15085,-0.15085 -0.42667,0 -0.64,0 -0.42667,-0.42667 -0.9453,-0.77794 -1.28,-1.28 -0.67969,-1.01954 0.54821,-3.38357 0,-4.48 -0.26985,-0.5397 -1.28,-0.6766 -1.28,-1.28 0,-0.95406 0.9783,-1.6549 1.28,-2.56 0.68041,-2.04122 0,-5.50919 0,-7.68 0,-0.88978 0.64,-1.868 0.64,-2.56 0,-1.37254 -0.95478,-3.1791 -1.28,-4.48 -0.42675,-1.70701 -0.33354,-9.85232 0,-11.52 -0.47537,-1.18446 1.09345,-1.17378 1.28,-1.92 0.2124,-0.84959 0,-4.45944 0,-5.12 0,-2.78969 0.7712,-6.9008 0,-9.6 -0.2621,-0.91735 -0.92567,-1.67418 -1.28,-2.56 -0.50806,-1.27014 -0.14919,-3.25296 -0.64,-4.48 -0.7235,-1.80874 -2.36014,-4.72028 -3.2,-6.4 -0.30981,-0.61962 -0.27044,-2.00566 -0.64,-2.56 -1.23875,-1.85812 -2.64736,-3.25824 -4.48,-4.48 -1.14807,-0.76538 -1.63507,-2.5063 -2.56,-3.2 -0.5397,-0.40477 -1.3166,-0.3383 -1.92,-0.64 -0.80954,-0.40477 -1.19592,-1.37694 -1.92,-1.92 -1.07139,-0.80354 -2.05341,-0.59205 -3.2,-1.28 -2.86675,-1.72005 -6.30627,-3.35085 -8.96,-5.12 -0.50206,-0.3347 -0.71976,-1.0559 -1.28,-1.28 -0.14531,-0.0581 -6.88005,-1.24001 -7.04,-1.28 -2.1181,-0.52953 -5.07574,-1.1834 -7.04,-1.92 -0.72021,-0.27008 -1.20583,-0.99433 -1.92,-1.28 -2.17546,-0.87018 -5.35311,0.46538 -7.68,0 -2.20578,-0.44116 -3.19406,-2.55802 -5.12,-3.2 -1.08105,-0.36035 -5.3974,0.7787 -6.4,1.28 -0.768,0.384 -1.152,1.536 -1.92,1.92 -1.29915,0.64958 -1.85679,-0.18963 -2.56,1.92 -0.51836,1.55508 -0.3942,6.10321 0,7.68 1.07772,4.31087 0.01,0.01 1.28,1.28 0.3017,0.3017 -0.19081,0.89838 0,1.28 0.58912,1.17825 1.33088,0.10175 1.92,1.28 0.19081,0.38162 -0.19081,0.89838 0,1.28 0.50793,1.01585 2.13766,1.49766 2.56,1.92 0.33731,0.33731 0.30269,0.94269 0.64,1.28 0.15085,0.15085 0.4625,-0.11834 0.64,0 1.46169,0.97446 1.47047,2.11047 2.56,3.2 0.82962,0.82962 2.80401,2.042 3.84,2.56 0.71816,0.35908 1.81866,0.26933 2.56,0.64 1.62595,0.81297 -0.65544,0.76491 1.92,1.28 2.66667,0.53333 1.06667,-0.35556 3.2,0 5.31052,0.88509 11.49002,1.28749 16.64,0 0.82785,-0.20696 1.73215,0.20696 2.56,0 1.35903,-0.33976 1.81737,-1.68956 3.2,-1.92 5.83251,-0.97208 -1.06174,1.40652 5.76,-0.64 1.10038,-0.33012 2.08547,-1.00137 3.2,-1.28 0.62089,-0.15522 1.28643,0.0905 1.92,0 2.1733,-0.31047 3.18768,-1.36791 5.12,-1.92 1.70398,-0.48685 3.50608,-0.47304 5.12,-1.28 1.12232,-0.56116 2.04534,-1.98267 3.2,-2.56 2.61261,-1.30631 0.78924,-0.14924 2.56,-1.92 0.15085,-0.15085 0.54459,0.19081 0.64,0 0.19081,-0.38162 -0.23667,-0.92499 0,-1.28 0.50294,-0.75442 2.05275,-0.90551 2.56,-1.92 0.19081,-0.38162 -0.23667,-0.92499 0,-1.28 0.50206,-0.75309 1.63378,-1.06135 1.92,-1.92 0.71225,-2.13676 0.31606,-7.04788 -0.64,-8.96 -0.73627,-1.47254 -3.32576,-2.29729 -3.84,-3.84 -0.13492,-0.40477 0.3017,-0.9783 0,-1.28 -0.3017,-0.3017 -0.89838,0.19081 -1.28,0 -0.6034,-0.3017 -0.16297,-1.44297 -0.64,-1.92 -0.15085,-0.15085 -0.44919,0.0954 -0.64,0 -0.34531,-0.17265 -3.57917,-2.93917 -3.84,-3.2 -0.15085,-0.15085 0.15085,-0.48915 0,-0.64 -1.33276,-1.33276 -3.26068,-2.21424 -4.48,-3.84 -0.28622,-0.38162 -0.24309,-1.01539 -0.64,-1.28 -0.35501,-0.23667 -0.87523,0.13492 -1.28,0 -0.85865,-0.28622 -1.16691,-1.41794 -1.92,-1.92 -0.73187,-0.48791 -1.77327,-0.24663 -2.56,-0.64 -4.11302,-2.05651 -7.5827,-4.61567 -12.16,-5.76 -1.87414,-0.46853 -3.90251,-0.10929 -5.76,-0.64 -0.73959,-0.21131 -1.23202,-0.93601 -1.92,-1.28 -2.72078,-1.36039 -6.69159,-1.1929 -9.6,-1.92 -0.46278,-0.1157 -0.81224,-0.54645 -1.28,-0.64 -0.82051,-0.1641 -1.73949,0.1641 -2.56,0 -2.67188,-0.53438 -5.73011,-1.0567 -8.32,-1.92 -2.44695,-0.81565 -5.08629,-2.18947 -7.68,-2.56 -4.27948,-0.61135 -9.12254,0 -13.44,0 -9.38667,0 -18.77333,0 -28.16,0 -7.04,0 -14.08,0 -21.12,0 -5.74424,0 -12.20993,-0.76134 -17.92,0 -3.6,0.48 -4.6,1.36 -7.68,1.92 -2.10104,1.3276 -4.79511,0.3193 -7.04,0.64 -2.27909,0.32558 -8.72474,3.40237 -10.88,4.48 -0.26985,0.13492 -0.34416,0.58083 -0.64,0.64 -2.48889,0.49778 -2.24,-0.37333 -4.48,0 -1.33088,0.22181 -2.71737,0.53158 -3.84,1.28 -0.1775,0.11834 0.15085,0.48915 0,0.64 -0.50248,0.50248 -2.4864,1.92 -3.2,1.92
                `
            ],
            [
                [0],
                [],
                0,
                true,
                false,
                [0.9, 0.1],
                [(window.innerWidth * 0.85), (window.innerHeight * 0.1)],
                `
                m 266.24,0
                c 0.42667,2.9866667 0.54827,6.0330908 1.28,8.96 0.14635,0.5853818 0.9453,0.7779427 1.28,1.28 0.95406,1.431084 1.57367,3.070963 2.56,4.48 1.99153,2.845041 5.02147,4.854054 7.04,7.68 1.72263,2.411679 2.92003,5.160051 4.48,7.68 2.42918,3.924063 5.41739,7.497587 7.68,11.52 4.46451,7.936913 -1.16275,1.170293 5.12,10.88 1.06849,1.651297 2.77642,2.82554 3.84,4.48 0.87857,1.366661 1.23294,3.007726 1.92,4.48 0.80691,1.729098 1.70667,3.413333 2.56,5.12 1.28,2.986667 2.49539,6.001858 3.84,8.96 1.30341,2.867499 3.23922,5.42485 4.48,8.32 6.06064,18.18191 -1.42447,-2.885065 3.84,8.96 1.47109,3.309962 0.56611,5.628536 1.28,8.96 1.56105,7.2849 1.90787,1.82296 2.56,7.04 0.29107,2.32855 -0.27419,4.70941 0,7.04 0.2542,2.16068 0.68232,4.30813 1.28,6.4 0.2621,0.91735 1.16853,1.61248 1.28,2.56 0.80915,6.87779 -0.7466,15.11086 -2.56,21.76 -3.29437,12.07934 -1.45983,2.45948 -4.48,11.52 -3.84269,11.52806 1.74111,-3.76445 -0.64,5.76 -0.39405,1.57619 -1.40623,2.93868 -1.92,4.48 -1.81302,5.43906 0.71554,-1.19257 -1.92,3.2 -1.58636,2.64393 -2.17085,6.01085 -4.48,8.32 -2.34963,2.34963 -4.77485,3.2117 -7.04,5.76 -0.63384,0.71307 -0.60538,1.88538 -1.28,2.56 -1.99967,1.99967 -6.02584,3.69526 -8.32,5.76 -1.34551,1.21096 -2.47769,2.64798 -3.84,3.84 -2.15932,1.8894 -10.27702,6.00463 -13.44,6.4 -2.14421,0.26803 -6.17579,0.26803 -8.32,0 -3.446,-0.43075 -6.9883,-0.70061 -10.24,-1.92 -1.77712,-0.66642 -2.91362,-2.41681 -4.48,-3.2 -0.19081,-0.0954 -0.48915,0.15085 -0.64,0 -0.47437,-0.47437 0.15437,-1.76563 -0.64,-2.56 -0.15085,-0.15085 -0.48915,0.15085 -0.64,0 -0.13844,-0.13844 -0.10101,-2.35799 0,-2.56 0.71209,-1.42418 2.49621,-1.21621 3.2,-1.92 0.33731,-0.33731 0.30269,-0.94269 0.64,-1.28 0.73654,-0.73654 6.01768,0.38512 6.4,0.64 1.84392,1.22928 3.32003,3.19431 5.12,4.48 8.62252,6.15895 -2.20528,-2.2583 4.48,1.92 1.15837,0.72398 2.08093,1.77665 3.2,2.56 2.85514,1.9986 5.49525,2.80884 8.32,5.12 0.82555,0.67545 1.16575,1.80575 1.92,2.56 1.93353,1.93353 4.66102,2.94627 6.4,5.12 0.98114,1.22642 2.05345,3.49725 3.2,4.48 3.99612,3.42524 1.43415,-1.42549 5.12,3.84 6.63842,9.48346 -2.43411,-1.32548 3.84,7.04 0.54306,0.72408 1.35459,1.21324 1.92,1.92 1.5288,1.911 2.48962,4.37443 3.84,6.4 0.75772,1.13658 1.8572,2.02866 2.56,3.2 2.02116,3.36859 3.23491,7.424 5.12,10.88 0.62794,1.15122 5.18501,7.61723 5.76,8.32 0.76419,0.93401 1.85856,1.57799 2.56,2.56 0.46863,0.65608 1.06249,4.00147 1.28,4.48 1.36837,3.01042 4.06603,5.79808 5.12,8.96 2.04139,6.12416 2.9525,12.49101 5.12,18.56 1.08998,3.05195 3.55644,5.50559 5.12,8.32 0.83528,1.50351 1.79082,2.94163 2.56,4.48 1.3404,2.6808 1.76732,5.69341 3.2,8.32 1.78698,3.27614 4.18187,6.2183 5.76,9.6 2.65786,5.69542 2.59995,12.01126 4.48,17.92 0.96159,3.02214 2.19711,5.95132 3.2,8.96 2.49702,7.49107 3.72585,15.41195 5.76,23.04 1.4498,5.43674 3.5585,11.11099 4.48,16.64 0.2455,1.47301 0,2.98667 0,4.48 0.21333,1.70667 0.3411,3.42622 0.64,5.12 0.49463,2.80291 0.94732,5.64514 1.92,8.32 0.55523,1.52688 1.50138,2.91016 1.92,4.48 0.44317,1.66187 0.22285,3.45141 0.64,5.12 0.23139,0.92557 1.02897,1.63956 1.28,2.56 0.59864,2.19503 0.58545,6.06271 1.28,8.32 0.4778,1.55285 1.36477,2.95312 1.92,4.48 0.62697,1.72416 0.80989,4.03627 1.28,5.76 0.84421,3.09543 2.20491,6.40416 2.56,9.6 0.14135,1.27217 -0.31045,2.59822 0,3.84 0.34709,1.38835 1.43094,2.49508 1.92,3.84 1.76764,4.86101 2.17672,9.60361 3.2,14.72 0.47744,2.38722 0.99486,1.93586 1.92,4.48 1.37839,3.79057 1.49661,6.42947 1.92,10.24 0.62075,5.58677 0.13163,0.26326 1.92,3.84 0.75965,1.51931 1.28,4.00513 1.28,5.76 0,2.40547 0.66574,5.98993 0,8.32 -0.2621,0.91735 -1.07304,1.62866 -1.28,2.56 -2.21947,9.98763 2.46219,-2.97177 -1.28,5.76 -1.31882,0.86593 -0.29601,2.16803 -0.64,3.2 -0.15085,0.45255 -1.21254,1.11223 -1.28,0.64 -0.21119,-1.47832 0,-2.98667 0,-4.48
                `
            ],
            [
                [0],
                [],
                0,
                true,
                false,
                [0.9, 0.1],
                [(window.innerWidth * 0.85), (window.innerHeight - window.innerHeight * 0.05)],
                `
                m 321.92,512
                c 3.68638,-18.26816 1.25457,-15.84492 16.64,-18.56 3.76397,-0.66423 7.25207,-1.65302 10.88,-2.56 2.09708,-0.52427 4.04002,-2.34001 5.76,-3.2 0.95266,-0.47633 1.70657,-1.99105 2.56,-2.56 0.1775,-0.11834 0.42667,0 0.64,0 0.42667,-0.21333 0.94269,-0.30269 1.28,-0.64 0.33731,-0.33731 0.30269,-0.94269 0.64,-1.28 0.47703,-0.47703 1.44297,-0.16297 1.92,-0.64 1.5111,-1.5111 -3.56973,0.33658 1.28,-1.28 0.20239,-0.0675 0.54459,0.19081 0.64,0 0.28622,-0.57243 -0.28622,-1.34757 0,-1.92 1.51932,-3.03865 5.00074,-7.84297 5.76,-10.88 0.35137,-1.40549 -0.35137,-3.07451 0,-4.48 -0.38575,-1.15836 1.03676,-1.19029 1.28,-1.92 0.65781,-1.97344 1.03936,-11.44318 0.64,-13.44 -0.57123,-2.85614 -2.08235,-5.45409 -2.56,-8.32 -0.14029,-0.84172 0.20696,-1.73215 0,-2.56 -0.58612,-2.3445 -3.20804,-4.49206 -4.48,-6.4 -0.81764,-1.22645 -1.95824,-1.50608 -3.2,-1.92 -1.59619,-0.53206 -1.19602,-1.23801 -2.56,-1.92 -0.0163,-0.008 -2.96741,-0.34914 -3.84,-0.64 -1.60401,-0.53467 -4.25002,0.75499 -5.76,0 -0.5397,-0.26985 -0.7403,-1.01015 -1.28,-1.28 -0.62572,-0.31286 -4.25623,-0.46725 -5.12,-0.64 -3.32941,-0.66588 -0.64,-0.42667 -3.2,-1.28 -2.13734,-0.71245 -4.27584,-0.28597 -6.4,-0.64 -1.33088,-0.22181 -2.50912,-1.05819 -3.84,-1.28 -4.26837,-0.7114 -8.80528,0.28132 -12.8,1.28 -1.34502,0.33625 -1.88598,1.48199 -3.2,1.92 -0.40477,0.13492 -0.89838,-0.19081 -1.28,0 -1.34472,0.67236 0.0124,1.26756 -0.64,1.92 -1.32418,1.32418 0.0518,-2.02353 -1.28,0.64 -0.59756,1.19513 0.92558,1.49675 1.28,2.56 0.15927,0.47781 -0.2747,1.50795 0,1.92 0.50206,0.75309 1.51523,1.11046 1.92,1.92 1.49015,2.9803 2.8535,3.9574 5.76,5.12 2.19104,-0.98308 2.08739,1.36369 3.2,1.92 0.19081,0.0954 0.42667,0 0.64,0 0.64,0.21333 1.34152,0.29291 1.92,0.64 1.39903,0.83942 2.16984,2.00328 3.84,2.56 0.53974,0.17991 1.41459,-0.2527 1.92,0 0.67965,0.33982 0.60035,0.94018 1.28,1.28 1.024,0.512 2.816,-0.512 3.84,0 0.19081,0.0954 -0.20239,0.57254 0,0.64 0.0883,0.0294 7.77876,0.27062 8.32,0 0.26985,-0.13492 0.35378,-0.54459 0.64,-0.64 0.63564,-0.21188 2.64672,0.36885 3.2,0 0.39691,-0.26461 0.24309,-1.01539 0.64,-1.28 0.35501,-0.23667 0.9783,0.3017 1.28,0 0.3017,-0.3017 -0.19081,-0.89838 0,-1.28 0.0388,-0.0776 1.81638,-0.53638 1.92,-0.64 0.11793,-0.11793 0.52207,-1.80207 0.64,-1.92 0.85333,-0.85333 0.61412,1.35765 1.28,-0.64 0.13492,-0.40477 -0.10348,-0.86607 0,-1.28 0.32378,-1.29511 1.57338,-1.52013 1.92,-2.56 0.13492,-0.40477 -0.13492,-0.87523 0,-1.28 0.19081,-0.57243 1.01015,-0.7403 1.28,-1.28 0.0954,-0.19081 -0.11834,-0.4625 0,-0.64 1.01973,-1.5296 3.00331,-2.80663 3.84,-4.48 0.18103,-0.36205 0.0581,-7.56388 0,-7.68 -0.26985,-0.5397 -1.01015,-0.7403 -1.28,-1.28 -0.75767,-1.51535 -0.88983,-2.76305 -1.92,-4.48 -2.53188,-4.21979 -5.31179,-8.14906 -8.32,-12.16 -0.9164,-1.22186 -2.60662,-2.91497 -3.84,-3.84 -1.0486,-0.78645 -2.27172,-0.35172 -3.2,-1.28 -0.15085,-0.15085 0.15085,-0.48915 0,-0.64 -0.60472,-0.60472 -2.42232,-1.53116 -3.2,-1.92 -0.78673,-0.39337 -1.80575,-0.18745 -2.56,-0.64 -0.77611,-0.46567 -1.16691,-1.41794 -1.92,-1.92 -0.56132,-0.37421 -1.28,-0.42667 -1.92,-0.64 -0.64,-0.64 -1.16691,-1.41794 -1.92,-1.92 -1.9363,-1.29087 -4.9203,-2.14015 -7.04,-3.2 -2.37261,-1.1863 -4.51271,-2.89227 -7.04,-3.84 -1.64718,-0.61769 -3.59259,-0.4072 -5.12,-1.28 -1.78472,-1.01984 -2.48895,-2.40358 -4.48,-3.2 -6.7681,-2.70724 -13.95566,-2.56 -21.12,-2.56 -1.28,0 -2.60925,-0.35164 -3.84,0 -0.73959,0.21131 -1.20583,0.99433 -1.92,1.28 -1.22354,0.48941 -3.25646,0.15059 -4.48,0.64 -0.71417,0.28567 -1.20583,0.99433 -1.92,1.28 -0.99038,0.39615 -2.14785,-0.17536 -3.2,0 -2.25738,0.37623 -3.58837,1.19612 -5.76,1.92 -1.56697,0.52232 -3.58651,0.12884 -5.12,0.64 -0.28622,0.0954 -0.42667,0.42667 -0.64,0.64 -0.42667,0.21333 -0.82745,0.48915 -1.28,0.64 -0.80954,0.26985 -1.7395,-0.23443 -2.56,0 -3.13019,0.89434 -3.57726,2.74863 -5.76,3.84 -0.19081,0.0954 -0.48915,-0.15085 -0.64,0 -0.32,0.32 0.32,1.6 0,1.92 -1.32418,1.32418 0.0518,-2.02353 -1.28,0.64 -0.54237,1.08474 0.3432,4.1832 0.64,4.48 0.3017,0.3017 0.9783,-0.3017 1.28,0 0.33731,0.33731 0.30269,0.94269 0.64,1.28 0.45255,0.45255 1.34757,-0.28622 1.92,0 0.19081,0.0954 -0.19081,0.54459 0,0.64 0.9596,0.4798 2.79536,-0.26116 3.84,0 1.11453,0.27863 2.08547,1.00137 3.2,1.28 2.15747,0.53937 5.69795,-0.99103 7.68,0 1.03343,0.51672 1.0746,1.01135 2.56,0.64 0.85333,-0.21333 1.72554,-0.36185 2.56,-0.64 0.57243,-0.19081 0.7403,-1.01015 1.28,-1.28 1.583,-0.7915 6.65944,0.19028 8.32,-0.64 0.42667,-0.21333 0.30269,-0.94269 0.64,-1.28 0.81502,-0.81502 2.807,-0.38175 3.84,-0.64 1.95755,-0.48939 3.74042,-1.4151 5.76,-1.92 0.80314,-0.20078 1.75686,0.20078 2.56,0 3.09052,-0.77263 -0.0317,-0.30414 1.92,-1.28 1.2515,-0.62575 4.95319,-0.55659 6.4,-1.28 0.26985,-0.13492 0.35378,-0.54459 0.64,-0.64 1.39379,-0.4646 3.83734,-0.318 5.12,-1.28 0.38162,-0.28622 0.24309,-1.01539 0.64,-1.28 0.35501,-0.23667 0.89838,0.19081 1.28,0 1.50783,-0.75392 2.35038,-2.45519 3.84,-3.2 0.76324,-0.38162 1.75046,0.26985 2.56,0 0.57243,-0.19081 0.7403,-1.01015 1.28,-1.28 1.5953,-0.79765 3.5247,-1.12235 5.12,-1.92 1.27077,-0.63539 2.53461,-1.9073 3.84,-2.56 1.86949,-0.93475 3.98432,-1.67216 5.76,-2.56 1.63574,-0.81787 2.99431,-2.20954 4.48,-3.2 0.95589,-0.63726 2.24411,-0.64274 3.2,-1.28 0.1775,-0.11834 -0.19081,-0.54459 0,-0.64 4.64343,-2.32171 2.49463,-0.79183 6.4,-1.28 1.7508,-0.21885 3.4452,-0.94504 5.12,-1.28 1.31254,-0.26251 5.82285,-2.38857 7.04,-3.2 0.25103,-0.16735 0.34731,-0.56683 0.64,-0.64 0.62089,-0.15522 1.28871,0.10522 1.92,0 2.51347,-0.41891 4.02295,-0.96918 6.4,-1.92 1.68714,-0.67486 5.24435,-0.0414 7.04,-0.64 0.72971,-0.24324 1.19029,-1.03676 1.92,-1.28 0.576,-0.192 1.344,0.192 1.92,0 0.45255,-0.15085 0.81722,-0.5243 1.28,-0.64 1.84755,-0.46189 7.03158,1.66232 8.32,1.92 2.34723,0.46945 8.38143,-0.92928 10.24,0 0.26985,0.13492 0.35378,0.54459 0.64,0.64 1.26105,0.42035 4.13748,-0.78602 5.12,0 0.99681,0.79745 3.42784,4.59392 4.48,5.12 0.38162,0.19081 0.93867,-0.256 1.28,0 0.72408,0.54306 1.11046,1.51523 1.92,1.92 0.57243,0.28622 1.32075,-0.22472 1.92,0 1.16473,0.43678 2.05664,1.42999 3.2,1.92 0.64471,0.2763 8.53244,1.63496 8.96,1.92 0.39691,0.26461 0.30269,0.94269 0.64,1.28 0.61606,0.61606 9.31928,2.16982 10.88,2.56 1.03482,0.2587 2.14405,-0.15085 3.2,0 3.09146,0.44164 6.78543,1.40728 9.6,0 1.09643,-0.54822 4.49166,0 5.76,0 4.63535,0 14.23634,0.78612 18.56,0 1.52804,-0.27783 2.94252,-1.06036 4.48,-1.28 1.47832,-0.21119 2.99107,0.11453 4.48,0 5.23472,-0.40267 10.38091,-2.34627 15.36,-3.84 3.93515,-1.18055 10.82199,-3.2 14.72,-3.2 1.64743,0 2.48651,-1.28 3.84,-1.28 0.64,0 2.56,0 1.92,0 -2.56,0 -5.12,0 -7.68,0
                `
            ],
            [
                [0],
                [],
                0,
                true,
                false,
                [0.9, 0.1],
                [(window.innerWidth * 0.13), (window.innerHeight * 0)],
                `
                m 311.04,0
                c -1.70667,3.84 -2.958,7.9166609 -5.12,11.52 -2.1238,3.539668 -15.0815,5.264602 -17.92,6.4 -5.04706,2.018823 -8.37067,5.022401 -12.8,7.68 -1.32787,0.796719 -2.38552,3.355175 -3.84,3.84 -0.80954,0.269848 -1.79676,-0.381622 -2.56,0 -2.15878,1.079391 -3.11177,3.78118 -5.12,5.12 -1.87055,1.247035 -5.45234,2.354892 -7.68,3.84 -1.00411,0.66941 -1.41513,2.178378 -2.56,2.56 -1.21431,0.404772 -2.9349,-0.905097 -3.84,0 -1.90047,1.900466 -1.28,5.311697 -1.28,7.68 0,2.986667 -0.42238,6.003351 0,8.96 1.00764,7.053468 18.12219,26.588124 24.32,30.72 -0.14577,2.424867 2.98667,0.853333 3.84,1.28 1.07939,0.539695 1.48061,2.020305 2.56,2.56 4.21708,2.10854 8.54567,0.216418 12.8,1.28 2.61791,0.654477 4.98152,2.56 7.68,2.56 0.42667,0 -0.3017,-0.978301 0,-1.28 0.52112,-0.521119 4.30062,-2.150311 5.12,-2.56 2.64203,-1.321014 7.45447,0.112763 10.24,-1.28 0.38162,-0.190811 0,-0.853333 0,-1.28 0,-3.688285 -1.72909,-3.989697 -5.12,-5.12 -2.6478,-0.882599 0.004,-1.277187 -3.84,-3.84 -1.03927,-0.692846 -4.25692,0.863083 -5.12,0 -0.67462,-0.674619 -0.60538,-1.885381 -1.28,-2.56 -0.6034,-0.603398 -1.79676,0.381622 -2.56,0 -2.71291,-1.356455 -6.87409,-3.279015 -10.24,-3.84 -4.56649,-0.761081 -9.51351,0.761081 -14.08,0 -7.30686,-1.21781 -10.57305,-0.734695 -17.92,0 -6.71576,0.671576 -13.79922,-0.954397 -20.48,0 -9.31396,1.330566 -1.774,0.591333 -7.68,2.56 -5.86808,1.956027 -18.13918,3.132784 -23.04,6.4 -2.87495,1.916636 -3.52505,3.203364 -6.4,5.12 -0.84173,0.561152 -5.85576,3.295764 -6.4,3.84 -0.6034,0.603398 0.38162,1.796755 0,2.56 -0.77817,1.556334 -1.82413,3.64825 -2.56,5.12 -1.57917,3.15835 -2.71863,1.91451 -3.84,6.4 -0.44253,1.77014 -0.6001,17.9998 0,19.2 0.5397,1.07939 1.80612,1.61765 2.56,2.56 5.88745,7.35932 11.22791,15.16527 19.2,20.48 8.06887,5.37925 -2.63868,-2.04515 5.12,1.28 2.28672,0.98002 4.17478,2.72739 6.4,3.84 1.2068,0.6034 2.68304,0.58582 3.84,1.28 1.03482,0.62089 1.48061,2.0203 2.56,2.56 0.76324,0.38162 1.7677,-0.31692 2.56,0 3.57648,1.43059 4.84979,2.99734 7.68,5.12 2.97371,2.23028 5.6833,1.66636 8.96,2.56 3.51699,0.95918 6.68791,3.02029 10.24,3.84 6.93929,1.60137 17.82973,0 25.6,0 3.80934,0 17.57198,1.45401 20.48,0 1.37339,-0.6867 4.27874,-7.24126 3.84,-7.68 -0.3017,-0.3017 -1.08919,0.38162 -1.28,0 -0.57243,-1.14487 0.9051,-2.9349 0,-3.84 -0.3017,-0.3017 -0.92499,0.23667 -1.28,0 -7.42156,-4.94771 -0.94784,-0.61569 -2.56,-3.84 -2.66353,-5.32705 0.0884,1.36837 -2.56,-1.28 -0.3017,-0.3017 0.3017,-0.9783 0,-1.28 -0.45574,-0.45574 -3.79496,-1.23496 -3.84,-1.28 -0.64,-0.64 -0.64,-1.92 -1.28,-2.56 -0.85095,-0.85095 -10.98316,0 -11.52,0 -9.09985,0 -19.13915,-1.12761 -28.16,0 -15.24348,1.90543 1.44174,0.27957 -7.68,2.56 -2.96886,0.74221 -6.3108,-0.0446 -8.96,1.28 -3.11756,1.55878 -5.93556,4.88778 -8.96,6.4 -1.22461,0.61231 -6.27314,3.64971 -6.4,3.84 -0.99492,1.49238 -8.2346,16.1065 -8.96,17.92 -1.38725,3.46812 -0.55405,7.89025 -1.28,11.52 -2.15544,10.77719 -0.0198,0.0395 -2.56,5.12 -2.8138,5.62759 4.98068,15.93034 8.96,17.92 2.3565,1.17825 0.2035,2.66175 2.56,3.84 1.92889,0.96444 5.65383,0.26691 7.68,1.28 4.55919,2.2796 8.30143,6.71071 12.8,8.96 0.38162,0.19081 0.85333,0 1.28,0 1.70667,0.85333 3.48381,1.57828 5.12,2.56 1.99493,1.19696 3.92551,3.3451 6.4,3.84 2.95477,0.59095 8.79355,0.37118 11.52,1.28 0.57243,0.19081 0.77794,0.9453 1.28,1.28 2.53008,1.68672 3.13498,0.28749 5.12,1.28 3.10571,1.55285 4.34533,1.66734 7.68,0 0.38162,-0.19081 0.9783,0.3017 1.28,0 0.6034,-0.6034 -0.26985,-1.75046 0,-2.56 0.48647,-1.45942 2.07353,-2.38058 2.56,-3.84 1.14782,-3.44347 -3.49621,-10.55207 -6.4,-11.52 -2.64423,-0.88141 -4.79003,-0.55751 -7.68,-1.28 -1.85114,-0.46279 -3.23785,-2.24631 -5.12,-2.56 -4.15402,-0.69234 -18.38871,-1.12376 -21.76,0 -1.45942,0.48647 -2.38058,2.07353 -3.84,2.56 -1.21431,0.40477 -2.58486,-0.25103 -3.84,0 -0.93553,0.18711 -1.60986,1.19362 -2.56,1.28 -5.30259,0.48205 -24.40171,-2.78332 -28.16,-1.28 -2.80541,1.12216 -5.92112,5.92112 -7.68,7.68 -0.3017,0.3017 -1.04333,-0.35501 -1.28,0 -0.95507,1.4326 -3.36657,7.06628 -3.84,8.96 -0.54807,2.19228 -0.71152,9.38544 0,11.52 2.43892,7.31677 0.2444,-7.738 2.56,3.84 0.71254,3.5627 -0.38798,6.90404 1.28,10.24 4.26667,8.53333 -1.70667,-5.97333 2.56,2.56 0.6034,1.2068 0.53158,2.71737 1.28,3.84 0.23667,0.35501 0.9783,-0.3017 1.28,0 2.87268,2.87268 3.47673,8.59673 6.4,11.52 0.3017,0.3017 0.93867,-0.256 1.28,0 5.25653,3.9424 8.82347,10.1376 14.08,14.08 2.46139,1.84604 5.12,3.41333 7.68,5.12 4.97994,3.31996 0.46147,-1.14815 8.96,1.28 1.62909,0.46545 2.38545,2.96727 3.84,3.84 4.8223,2.89338 7.90717,1.88287 12.8,3.84 2.76801,1.10721 7.00214,4.14107 8.96,5.12 3.98466,1.99233 20.42854,7.92571 25.6,8.96 1.25514,0.25103 2.6415,-0.44944 3.84,0 4.41953,1.65732 7.03827,4.37304 11.52,5.12 1.68345,0.28057 3.45704,-0.38376 5.12,0 3.94406,0.91017 7.8351,2.16504 11.52,3.84 1.09863,0.49938 1.48061,2.0203 2.56,2.56 2.41359,1.2068 5.03393,2.03078 7.68,2.56 1.25514,0.25103 2.59822,-0.31045 3.84,0 0.14206,0.0355 8.63066,3.61009 10.24,3.84 3.37903,0.48272 6.89295,-0.66941 10.24,0 4.77028,0.95406 9.46489,2.30163 14.08,3.84 1.81019,0.6034 3.24267,2.21867 5.12,2.56 3.55342,0.64608 18.11003,1.04285 21.76,0 2.75204,-0.7863 4.87341,-3.27868 7.68,-3.84 6.33377,-1.26676 10.27861,0.62069 16.64,-2.56 2.44357,-1.22179 3.18818,-4.46818 5.12,-6.4 0.0795,-3.60414 2.88594,-0.32594 3.84,-1.28 0.3017,-0.3017 -0.19081,-0.89838 0,-1.28 0.91439,-1.82877 2.67982,-1.78654 3.84,-2.56 3.14061,-2.09374 3.89085,-6.41695 7.68,-7.68 1.21431,-0.40477 2.9349,0.9051 3.84,0 2.85013,-4.86858 0,-1.77845 0,-2.56 0,-2.66353 1.79503,-0.51503 2.56,-1.28 0.67462,-0.67462 0.60538,-1.88538 1.28,-2.56
                `
            ],
            [
                [0],
                [],
                0,
                true,
                false,
                [0.9, 0.1],
                [(window.innerWidth * 0.53), (window.innerHeight - window.innerHeight * 0.1)],
                `
                m 235.52,512
                c 0,-5.12 -0.67668,-10.28491 0,-15.36 0.20332,-1.52487 1.95401,-2.42602 2.56,-3.84 0.69298,-1.61695 1.03121,-3.37849 1.28,-5.12 0.44134,-3.08935 0.12513,-7.35282 1.28,-10.24 1.80896,-4.52241 3.02354,-4.06126 3.84,-8.96 0.62303,-3.73816 -0.53616,-7.76686 0,-11.52 1.03079,-7.21552 3.0727,-36.86189 1.28,-42.24 -0.48647,-1.45942 -1.98866,-2.41166 -2.56,-3.84 -1.56857,-3.92142 0.99965,-7.11931 2.56,-10.24 0.93022,-1.86045 -2.14482,-4.7393 -2.56,-6.4 -0.70275,-2.81098 0.70274,-6.14902 0,-8.96 -0.67395,-2.69578 -2.9599,-5.03969 -3.84,-7.68 -0.5397,-1.61909 0.3347,-3.44648 0,-5.12 -0.79331,-3.96653 -2.96669,-7.01003 -5.12,-10.24 -1.18336,-1.77504 0.51741,-4.33036 0,-6.4 -0.46714,-1.86856 -4.42608,-3.14608 -5.12,-3.84 -1.84278,-1.84278 -1.28458,-5.76688 -2.56,-7.68 -1.00411,-1.50617 -3.03046,-2.22091 -3.84,-3.84 -0.38162,-0.76324 0.6034,-1.9566 0,-2.56 -0.3017,-0.3017 -0.85333,0 -1.28,0 -0.85333,-0.85333 -1.83592,-1.59456 -2.56,-2.56 -1.39173,-1.85564 -2.44827,-4.54436 -3.84,-6.4 -2.94063,-3.92084 0.81871,2.09871 -3.84,-2.56 -1.92,-1.92 -3.2,-4.48 -5.12,-6.4 -1.38577,-1.38577 -13.767,-9.84175 -15.36,-10.24 -0.82786,-0.20696 -1.75046,0.26985 -2.56,0 -0.57243,-0.19081 -0.85333,-0.85333 -1.28,-1.28 -0.85333,-0.42667 -1.63443,-1.04861 -2.56,-1.28 -2.96887,-0.74222 -7.19243,0 -10.24,0 -1.10655,0 -6.78571,-0.5962 -7.68,0 -0.79382,0.52921 -0.60538,1.88538 -1.28,2.56 -0.6034,0.6034 -1.79676,-0.38162 -2.56,0 -2.0317,1.01585 -2.99532,4.27531 -3.84,5.12 -0.67462,0.67462 -2.13333,0.42667 -2.56,1.28 -0.57243,1.14487 0,2.56 0,3.84 0,1.28 -0.57243,2.69513 0,3.84 1.024,2.048 4.096,3.072 5.12,5.12 0.38162,0.76324 -0.6034,1.9566 0,2.56 0.67462,0.67462 1.88538,0.60538 2.56,1.28 0.3017,0.3017 -0.3017,0.9783 0,1.28 0.95406,0.95406 2.88594,0.32594 3.84,1.28 0.23586,0.23586 1.04414,3.60414 1.28,3.84 1.14102,1.14102 3.76061,0.6003 5.12,1.28 6.04941,3.0247 10.61901,2.56 17.92,2.56 2.60722,0 8.603,0.357 10.24,-1.28 0.3017,-0.3017 -0.3017,-0.9783 0,-1.28 1.26628,-1.26628 5.33463,-0.42925 6.4,-2.56 0.38162,-0.76324 -0.6034,-1.9566 0,-2.56 0.3017,-0.3017 0.9783,0.3017 1.28,0 0.92205,-0.92205 3.79889,-8.25833 5.12,-10.24 1.57499,-2.36249 5.13155,-3.86309 6.4,-6.4 1.59828,-3.19656 0.0289,-7.70889 2.56,-10.24 0.67462,-0.67462 2.03079,-0.48618 2.56,-1.28 0.47334,-0.71002 -0.31692,-1.7677 0,-2.56 0.71883,-1.79707 2.97363,-4.66726 3.84,-6.4 0.768,-1.536 3.072,-2.304 3.84,-3.84 0.512,-1.024 -0.512,-2.816 0,-3.84 0.5397,-1.07939 1.93911,-1.52518 2.56,-2.56 2.20141,-3.66902 1.91863,-9.59863 5.12,-12.8 0.879,-0.879 5.8369,-4.27535 6.4,-5.12 4.05571,-6.08357 -4.91605,1.07604 1.28,-5.12 0.3017,-0.3017 0.9783,0.3017 1.28,0 2.85589,-2.85589 3.53309,-8.16655 7.68,-10.24 0.76324,-0.38162 1.75046,0.26985 2.56,0 5.20056,-1.73352 -0.0894,-0.71439 5.12,-3.84 1.15696,-0.69418 2.6332,-0.6766 3.84,-1.28 1.96042,-0.98021 1.00098,-2.28098 2.56,-3.84 0.6034,-0.6034 1.9566,0.6034 2.56,0 2.64837,-2.64837 -4.04705,0.10353 1.28,-2.56 1.2068,-0.6034 2.6332,-0.6766 3.84,-1.28 2.15703,-1.07851 2.47729,-2.9591 5.12,-3.84 2.83734,-0.94578 6.79225,2.75612 8.96,3.84 1.49751,0.74875 6.81354,3.82031 7.68,5.12 0.52921,0.79382 0.60538,1.88538 1.28,2.56 2.64837,2.64837 -0.10353,-4.04705 2.56,1.28 0.54735,1.09469 0.73265,2.74531 1.28,3.84 0.5397,1.07939 2.0203,1.48061 2.56,2.56 0.81572,1.63145 -0.44423,4.6231 0,6.4 0.82088,3.28351 2.26853,3.72588 1.28,7.68 -0.14635,0.58538 -1.08919,0.70757 -1.28,1.28 -0.40477,1.21431 0.57243,2.69513 0,3.84 -0.85719,1.71437 -3.05361,1.77361 -3.84,2.56 -0.2274,0.2274 -1.65111,2.93111 -2.56,3.84 -1.15979,1.15979 -3.83594,5.11594 -3.84,5.12 -0.81192,0.81192 -4.05429,-0.53286 -5.12,0 -4.7697,2.38485 -13.02723,1.63092 -17.92,0 -1.7173,-0.57243 -2.33383,-2.83589 -3.84,-3.84 -0.71002,-0.47334 -1.9566,0.6034 -2.56,0 -0.6034,-0.6034 0.38162,-1.79676 0,-2.56 -2.66353,-5.32705 0.0884,1.36837 -2.56,-1.28 -3.10887,-3.10887 0.38063,-1.87958 -2.56,-3.84 -0.79382,-0.52922 -2.03079,-0.48618 -2.56,-1.28 -0.47334,-0.71002 0.20696,-1.73215 0,-2.56 -0.14364,-0.57454 -3.3963,-7.3842 -3.84,-7.68 -0.71002,-0.47334 -1.9566,0.6034 -2.56,0 -0.6034,-0.6034 0.26985,-1.75046 0,-2.56 -0.6397,-1.91911 -2.69668,-3.40502 -3.84,-5.12 -0.7866,-1.1799 0.46438,-3.72687 0,-5.12 -1.05936,-3.17809 -3.15813,-5.55066 -3.84,-8.96 -0.85333,-4.26667 1.70667,-1.70667 0,-7.68 -0.42262,-1.47918 -1.87202,-2.46404 -2.56,-3.84 -0.5202,-1.0404 -0.50921,-7.43238 0,-8.96 0.19081,-0.57243 0.85333,-0.85333 1.28,-1.28 0.42667,-0.85333 1.04861,-1.63443 1.28,-2.56 1.12649,-4.50596 1.82493,-8.76987 3.84,-12.8 1.62826,-3.25652 6.05174,-5.70348 7.68,-8.96 0.57243,-1.14487 -0.31045,-2.59822 0,-3.84 0.69384,-2.77538 3.14616,-3.62462 3.84,-6.4 0.20696,-0.82786 -0.38162,-1.79676 0,-2.56 4.16749,-8.33497 1.28281,2.55157 3.84,-5.12 0.26985,-0.80954 -0.6034,-1.9566 0,-2.56 2.64837,-2.64837 -0.10353,4.04705 2.56,-1.28 0.71676,-1.43351 0.6034,-3.7668 1.28,-5.12 0.5397,-1.07939 1.83592,-1.59456 2.56,-2.56 1.14487,-1.52649 1.50157,-3.53236 2.56,-5.12 0.72892,-1.09337 8.00437,-4.16437 8.96,-5.12 0.67462,-0.67462 0.60538,-1.88538 1.28,-2.56 0.47445,-0.47445 4.32921,-0.88461 5.12,-1.28 1.43931,-0.71966 2.32378,-3.33459 3.84,-3.84 0.80954,-0.26985 1.79676,0.38162 2.56,0 0.38162,-0.19081 -0.35501,-1.04333 0,-1.28 2.88815,-1.92544 6.12294,-1.94863 8.96,-3.84 1.00411,-0.66941 1.48061,-2.0203 2.56,-2.56 0.75541,-0.3777 2.97967,0 3.84,0
                `
            ],
            [
                [0],
                [],
                0,
                true,
                false,
                [0.9, 0.1],
                [(window.innerWidth * 0.75), (window.innerHeight - window.innerHeight * 0.05)],
                `
                m 200.32,512
                c 0.51253,-8.77172 -0.64,-16.94562 -0.64,-25.6 0,-2.23602 0.69559,-5.59322 0,-7.68 -0.59624,-1.78872 -1.33469,-3.36408 -1.92,-5.12 -0.256,-0.768 0.256,-1.792 0,-2.56 -0.55752,-1.67255 -1.61989,-2.67934 -1.92,-4.48 -0.14029,-0.84172 0.14029,-1.71828 0,-2.56 -0.37218,-2.23309 -2.23491,-4.46981 -3.2,-6.4 -0.37444,-0.74887 -0.21782,-2.56674 -0.64,-3.2 -0.49231,-0.73846 -1.42769,-1.18154 -1.92,-1.92 -1.90869,-2.86304 -2.04185,-7.16185 -4.48,-9.6 -0.33731,-0.33731 -1.01539,-0.24309 -1.28,-0.64 -0.23667,-0.35501 0.0837,-0.86162 0,-1.28 -0.42055,-2.10273 -1.60975,-5.13951 -2.56,-7.04 -0.40477,-0.80954 -1.37694,-1.19592 -1.92,-1.92 -0.95732,-1.27643 -1.21065,-2.42131 -1.92,-3.84 -0.26985,-0.5397 -0.96955,-0.76259 -1.28,-1.28 -0.93932,-1.56553 -1.88578,-3.80578 -3.2,-5.12 -0.15085,-0.15085 -0.48915,0.15085 -0.64,0 -0.67462,-0.67462 -0.75079,-1.76618 -1.28,-2.56 -0.57183,-0.85774 -1.22253,-2.50253 -1.92,-3.2 -0.15085,-0.15085 -0.48915,0.15085 -0.64,0 -1.23024,-1.23024 -3.48699,-6.68699 -5.12,-8.32 -0.15085,-0.15085 -0.42667,0 -0.64,0 -0.42667,-0.42667 -0.91796,-0.79728 -1.28,-1.28 -1.61366,-2.15155 -3.88392,-5.78196 -6.4,-7.04 -0.78673,-0.39337 -1.74332,-0.31333 -2.56,-0.64 -1.19885,-0.47954 -2.66542,-2.49525 -3.84,-3.2 -2.10187,-1.26112 -4.31763,-2.01007 -6.4,-3.2 -1.71367,-0.97924 -5.79907,-4.70636 -7.04,-5.12 -0.40477,-0.13492 -0.86607,0.10348 -1.28,0 -0.92557,-0.23139 -1.6549,-0.9783 -2.56,-1.28 -0.60716,-0.20239 -1.29911,0.15522 -1.92,0 -0.46278,-0.1157 -0.81722,-0.5243 -1.28,-0.64 -0.60235,-0.15059 -1.31765,0.15059 -1.92,0 -1.80486,-0.45122 -3.29522,-1.55504 -5.12,-1.92 -4.08393,-0.81679 -9.42628,-0.029 -13.44,0.64 -1.29493,0.21582 -3.2178,-0.42073 -4.48,0 -0.28622,0.0954 -0.35378,0.54459 -0.64,0.64 -0.40477,0.13492 -0.87523,-0.13492 -1.28,0 -1.1469,0.3823 -0.1331,0.8977 -1.28,1.28 -0.40477,0.13492 -0.898378,-0.19081 -1.28,0 -0.603398,0.3017 -0.162972,1.44297 -0.64,1.92 -0.150849,0.15085 -0.489151,-0.15085 -0.64,0 -0.150849,0.15085 0.09541,0.44919 0,0.64 -0.97586,1.95172 -0.507369,-1.17052 -1.28,1.92 -0.357748,1.43099 -0.33269,5.06924 0,6.4 2.125385,8.50154 5.57096,5.10281 12.8,5.76 4.33853,0.39441 15.77483,2.03258 19.84,0 0.38162,-0.19081 0.89838,0.19081 1.28,0 1.024,-0.512 1.536,-2.048 2.56,-2.56 0.79029,-0.39514 1.76971,-0.88486 2.56,-1.28 2.56,-1.28 3.84,-5.12 6.4,-6.4 0.19081,-0.0954 0.48915,0.15085 0.64,0 1.46841,-1.46841 1.78331,-3.70331 3.2,-5.12 0.15085,-0.15085 0.48915,0.15085 0.64,0 0.45255,-0.45255 -0.20239,-1.31284 0,-1.92 0.19081,-0.57243 1.01015,-0.7403 1.28,-1.28 0.40786,-0.81572 -0.22211,-2.31155 0,-3.2 0.48966,-1.95863 1.41348,-3.73391 1.92,-5.76 0.20696,-0.82785 -0.16735,-1.72324 0,-2.56 0.35812,-1.79059 1.12588,-3.53176 1.92,-5.12 0.28622,-0.57243 -0.15522,-1.29911 0,-1.92 0.37029,-1.48117 1.27407,-2.54815 1.92,-3.84 0.27974,-0.55949 -0.13511,-2.01956 0,-2.56 0.3798,-1.51921 0.78325,-2.98975 1.28,-4.48 0.27932,-0.83796 -0.47616,-2.48576 0,-3.2 0.26461,-0.39691 0.99378,-0.25838 1.28,-0.64 1.29781,-1.73041 0.26368,-3.87842 0.64,-5.76 -0.47537,-1.18446 1.09345,-1.17378 1.28,-1.92 0.79782,-3.19128 -0.12018,-8.99908 0.64,-12.8 -0.14687,-1.28521 1.00137,-2.08547 1.28,-3.2 0.20696,-0.82785 -0.20696,-1.73215 0,-2.56 0.43004,-1.72016 1.3512,-3.41359 1.92,-5.12 0.26985,-0.80954 -0.14029,-1.71828 0,-2.56 -0.22228,-1.30217 1.05469,-2.07347 1.28,-3.2 0.37302,-1.86512 0.32663,-3.87978 0.64,-5.76 0.28555,-1.71332 1.39248,-2.89744 1.92,-4.48 0.2472,-0.74161 -0.18614,-1.81543 0,-2.56 0.426,-1.70399 0.98047,-3.32285 1.28,-5.12 0.10522,-0.63129 -0.23769,-1.32577 0,-1.92 0.2241,-0.56024 0.9453,-0.77794 1.28,-1.28 0.29295,-0.43943 -0.13773,-2.14681 0,-2.56 0.23379,-0.70137 1.50502,-1.29753 1.92,-1.92 0.76376,-1.14563 1.37473,-2.74946 1.92,-3.84 -0.1667,-1.35217 1.01539,-0.24309 1.28,-0.64 0.37421,-0.56132 0.23523,-1.3803 0.64,-1.92 0.28622,-0.38162 0.94269,-0.30269 1.28,-0.64 1.10827,-1.10827 1.67789,-3.15683 2.56,-4.48 0.78172,-1.17257 3.65813,-4.93813 4.48,-5.76 0.33731,-0.33731 0.94269,-0.30269 1.28,-0.64 0.47703,-0.47703 0.23523,-1.3803 0.64,-1.92 0.76804,-1.02406 5.52285,-6.45524 6.4,-7.04 0.56132,-0.37421 1.3803,-0.23523 1.92,-0.64 0.96544,-0.72408 1.48061,-2.0203 2.56,-2.56 0.38162,-0.19081 0.9783,0.3017 1.28,0 0.33731,-0.33731 0.30269,-0.94269 0.64,-1.28 0.26819,-0.26819 1.53212,-0.44606 1.92,-0.64 1.74406,-0.87203 2.7337,-2.96685 4.48,-3.84 0.7048,-0.3524 1.80955,0.25015 2.56,0 4.63579,-1.54526 -1.00903,0.18451 1.92,-1.28 1.00517,-0.50259 2.91878,0.61415 3.84,0 0.50206,-0.3347 0.77794,-0.9453 1.28,-1.28 0.283,-0.18867 10.42716,-0.11321 10.88,0 0.92557,0.23139 1.6549,0.9783 2.56,1.28 0.99886,0.33295 4.86524,0.38524 5.12,0.64 0.3017,0.3017 -0.19081,0.89838 0,1.28 0.28622,0.57243 1.34757,-0.28622 1.92,0 0.38162,0.19081 -0.3017,0.9783 0,1.28 2.49775,2.49775 0.34371,-0.14814 1.92,0.64 1.01585,0.50793 1.49766,2.13766 1.92,2.56 0.15085,0.15085 0.48915,-0.15085 0.64,0 1.07773,1.07773 1.90791,5.15627 1.28,7.04 -0.89574,2.68723 -3.15129,3.54548 -4.48,5.76 -1.15617,1.92695 -1.61168,3.22335 -2.56,5.12 -0.51767,1.03534 -1.7556,1.5178 -2.56,1.92 -0.89268,0.44634 -0.70738,1.7965 -1.28,2.56 -0.91308,1.21744 -8.09454,6.28727 -9.6,7.04 -2.66804,1.33402 -5.47422,1.35084 -8.32,1.92 -0.41838,0.0837 -0.88385,-0.15846 -1.28,0 -2.35298,0.94119 -1.9691,1.41782 -4.48,1.92 -0.41838,0.0837 -0.85333,0 -1.28,0 -0.85333,0 -1.72699,-0.18511 -2.56,0 -1.12148,0.24922 -2.09537,0.96439 -3.2,1.28 -2.91166,0.8319 -10.36611,1.40847 -13.44,0.64 -0.46278,-0.1157 -0.82745,-0.48915 -1.28,-0.64 -0.36197,-0.12066 -1.66295,0.25705 -1.92,0 -0.33731,-0.33731 -0.30269,-0.94269 -0.64,-1.28 -0.62051,-0.62051 -3.06067,-2.30022 -3.84,-2.56 -0.40477,-0.13492 -0.87523,0.13492 -1.28,0 -0.57243,-0.19081 -0.7403,-1.01015 -1.28,-1.28 -0.19081,-0.0954 -0.48915,0.15085 -0.64,0 -0.15085,-0.15085 0.19081,-0.54459 0,-0.64 -0.38162,-0.19081 -0.92499,0.23667 -1.28,0 -2.33853,-1.55902 0.68622,-0.93689 -1.28,-1.92 -0.8044,-0.4022 -2.04233,-0.88466 -2.56,-1.92 -0.43214,-0.86428 -2.01803,-5.21803 -2.56,-5.76 -1.5111,-1.5111 0.33658,3.56973 -1.28,-1.28 -0.8461,-2.53829 3.54029,3.76714 -0.64,-3.2 -0.24543,-0.40905 -0.94269,-0.30269 -1.28,-0.64 -0.77095,-0.77095 -0.9136,-5.0272 -1.28,-5.76 -0.0954,-0.19081 -0.48915,0.15085 -0.64,0 -0.41225,-0.41225 0.14414,-2.62342 0,-3.2 -0.0761,-0.30447 -1.20388,-1.61553 -1.28,-1.92 -0.46207,-1.84826 -0.17839,-3.91358 -0.64,-5.76 -0.77263,-3.09052 -0.30414,0.0317 -1.28,-1.92 -0.59589,-1.19178 0.20492,-3.89048 0,-5.12 -0.50849,-3.05096 -0.64,-5.80023 -0.64,-8.96 0,-5.12 0,-10.24 0,-15.36 0,-1.60104 -0.31149,-3.56256 0,-5.12 0.40267,-2.01337 1.28066,-5.76198 1.92,-7.68 0.0954,-0.28622 0.54459,-0.35378 0.64,-0.64 0.13492,-0.40477 -0.10348,-0.86607 0,-1.28 0.23139,-0.92557 1.04861,-1.63443 1.28,-2.56 0.15522,-0.62089 -0.20239,-1.31284 0,-1.92 0.44005,-1.32016 1.58303,-2.49211 1.92,-3.84 0.56194,-2.24774 1.91325,-5.53541 3.2,-7.68 0.46567,-0.77611 1.51523,-1.11046 1.92,-1.92 0.0954,-0.19081 -0.15085,-0.48915 0,-0.64 0.47703,-0.47703 1.6183,-0.0366 1.92,-0.64 0.43769,-0.87538 0.11656,-2.61828 1.28,-3.2 1.24725,-0.62362 2.36492,-2.06831 3.84,-2.56 0.21459,-0.0715 1.83718,0.16565 1.92,0 0.19081,-0.38162 -0.19081,-0.89838 0,-1.28 0.0798,-0.15968 2.29934,0 2.56,0 1.1444,0 1.00665,-0.82332 1.92,-1.28 0.48483,-0.24241 1.38885,0.13279 1.92,0 1.80351,-0.45088 3.57374,-1.14687 5.12,-1.92 1.07384,-0.53692 10.39116,-0.28221 11.52,0 0.58538,0.14635 0.70757,1.08919 1.28,1.28 0.96,0.32 2.24,-0.32 3.2,0 2.26719,0.75573 4.06898,1.33725 6.4,1.92 1.77208,0.44302 2.84118,2.38059 4.48,3.2 1.02755,0.51377 2.17245,0.76623 3.2,1.28 0.86986,0.43493 1.69014,1.48507 2.56,1.92 0.38162,0.19081 0.89838,-0.19081 1.28,0 0.5397,0.26985 0.77794,0.9453 1.28,1.28 1.19856,0.79904 2.00144,0.48096 3.2,1.28 1.26788,-0.0639 0.30269,0.94269 0.64,1.28 0.35957,0.35957 2.73834,0.48611 3.2,0.64 0.92339,0.3078 5.86507,5.49253 7.68,6.4 0.52076,0.26038 2.67924,0.37962 3.2,0.64 0.5242,0.2621 3.68631,2.49852 3.84,2.56 0.59423,0.23769 1.34757,-0.28622 1.92,0 0.80954,0.40477 1.16691,1.41794 1.92,1.92 1.48299,0.98866 2.95194,0.36317 4.48,1.28 1.82155,1.09293 0.57884,1.42471 2.56,1.92 1.42327,0.35582 3.14492,0.38995 4.48,1.28 0.1775,0.11834 -0.19081,0.54459 0,0.64 0.38162,0.19081 0.92499,-0.23667 1.28,0 0.39691,0.26461 0.24309,1.01539 0.64,1.28 0.88752,0.59168 2.16518,-0.2587 3.2,0 0.29269,0.0732 0.3383,0.64 0.64,0.64 1.55902,0 1.72969,-1.1301 3.2,-0.64 0.57243,0.19081 0.7403,1.01015 1.28,1.28 2.19578,1.09789 4.74114,-1.36705 6.4,-1.92 0.40477,-0.13492 0.89838,0.19081 1.28,0 0.19081,-0.0954 0.21333,-0.64 0,-0.64 -0.21333,0 -0.21333,0.64 0,0.64 0.47703,0 0.94269,-0.30269 1.28,-0.64 0.33731,-0.33731 0.21333,-1.06667 0.64,-1.28 0.57243,-0.28622 1.408,0.384 1.92,0 0.5397,-0.40477 0.16297,-1.44297 0.64,-1.92 0.64,-0.64 1.28,0.32 1.92,0 0.98021,-0.4901 0.50049,-1.14049 1.28,-1.92 0.36096,-0.36096 3.20268,-1.60134 3.84,-1.92 0.5397,-0.26985 0.7403,-1.01015 1.28,-1.28 0.53286,-0.26643 2.15404,0.40596 2.56,0 0.10362,-0.10362 0.56242,-1.88121 0.64,-1.92 0.57243,-0.28622 1.46745,0.45255 1.92,0 1.32418,-1.32418 -2.02353,0.0518 0.64,-1.28 0.90415,-0.45207 1.30067,-0.0207 1.92,-0.64 0.15085,-0.15085 -0.0954,-0.44919 0,-0.64 0.26985,-0.5397 1.08919,-0.70757 1.28,-1.28 0.47487,-1.4246 0.42152,-3.0492 1.28,-4.48 0.31045,-0.51741 0.9453,-0.77794 1.28,-1.28 0.59616,-0.89423 4.10578,-9.3831 4.48,-10.88 0.2587,-1.03482 -0.20919,-2.15405 0,-3.2 0.35302,-1.76508 1.10613,-2.85227 1.92,-4.48 0.28622,-0.57243 -0.15522,-1.29911 0,-1.92 0.52364,-2.09456 1.38861,-4.27445 1.92,-6.4 0.0475,-0.18991 0.0221,-7.01787 0,-7.04 -0.15085,-0.15085 -0.42667,0 -0.64,0 -0.21333,-0.21333 -0.47265,-0.38897 -0.64,-0.64 -1.08092,-1.62138 0.10334,-2.99333 -0.64,-4.48 -0.0954,-0.19081 -0.42667,0 -0.64,0 -0.21333,-0.42667 -0.48915,-0.82745 -0.64,-1.28 -0.0675,-0.20239 0.15085,-0.48915 0,-0.64 -0.15085,-0.15085 -0.48915,0.15085 -0.64,0 -0.15085,-0.15085 0,-0.42667 0,-0.64 -0.42667,-0.42667 -0.77794,-0.9453 -1.28,-1.28 -0.5211,-0.3474 -2.14311,-0.86311 -2.56,-1.28 -0.15085,-0.15085 0.15085,-0.48915 0,-0.64 -0.09,-0.09 -2.50923,-0.0762 -2.56,0 -0.56978,0.85467 -1.4078,2.8156 -1.92,3.84 -1.22891,2.45783 -1.12972,7.98056 0,10.24 0.24067,0.48133 -0.29604,1.47594 0,1.92 0.74134,1.11201 1.60928,2.24928 2.56,3.2 0.96814,0.96814 1.6723,2.3123 2.56,3.2 0.33731,0.33731 0.94269,0.30269 1.28,0.64 0.33731,0.33731 0.30269,0.94269 0.64,1.28 1.40283,1.40283 3.52555,2.64417 5.12,3.84 0.61535,0.46151 1.3761,0.7361 1.92,1.28 0.15085,0.15085 -0.19081,0.54459 0,0.64 0.38162,0.19081 0.85333,0 1.28,0 0.42667,0.21333 0.88309,0.37539 1.28,0.64 2.72195,1.81463 5.41585,4.41117 8.96,5.12 0.62757,0.12551 1.32577,-0.23769 1.92,0 0.84036,0.33614 1.06135,1.63378 1.92,1.92 0.40477,0.13492 0.87523,-0.13492 1.28,0 1.9956,0.6652 3.90242,3.24162 5.76,4.48 1.24091,0.82727 8.30287,2.54287 8.96,3.2 0.15085,0.15085 -0.15085,0.48915 0,0.64 0.5439,0.5439 1.23202,0.93601 1.92,1.28 0.20594,0.10297 8.11406,0.10297 8.32,0 0.5397,-0.26985 0.7403,-1.01015 1.28,-1.28 0.78673,-0.39337 1.82813,-0.15209 2.56,-0.64 0.75309,-0.50206 1.11046,-1.51523 1.92,-1.92 0.19081,-0.0954 0.48915,0.15085 0.64,0 0.33731,-0.33731 0.30269,-0.94269 0.64,-1.28 0.66049,-0.66049 1.85995,-0.92998 2.56,-1.28 0.80954,-0.40477 1.16691,-1.41794 1.92,-1.92 0.1775,-0.11834 0.42667,0 0.64,0 0.64,-0.42667 1.31937,-0.79949 1.92,-1.28 0.87874,-0.70299 1.6079,-1.92526 2.56,-2.56 0.41306,-0.27537 2.28282,-1.00282 2.56,-1.28 0.15085,-0.15085 -0.19081,-0.54459 0,-0.64 0.38162,-0.19081 0.9783,0.3017 1.28,0 0.3017,-0.3017 -0.19081,-0.89838 0,-1.28 0.1177,-0.2354 2.14805,0 2.56,0 1.73177,0 4.10794,-0.41301 5.76,0 1.05531,0.26383 2.19001,0.236 3.2,0.64 0.71417,0.28567 1.20583,0.99433 1.92,1.28 1.62304,0.64921 4.02825,0.20706 5.76,0.64 0.1125,0.0281 6.19329,1.63776 7.04,1.92 0.72971,0.24324 1.19029,1.03676 1.92,1.28 0.96,0.32 2.24,-0.32 3.2,0 1.21357,0.40452 2.67826,1.33913 3.84,1.92 1.11982,0.55991 2.85682,-0.34318 3.84,0.64 0.15085,0.15085 -0.15085,0.48915 0,0.64 0.15085,0.15085 0.44919,-0.0954 0.64,0 0.88265,0.44133 1.72671,1.36447 2.56,1.92 1.66574,1.11049 3.45493,1.3112 5.12,2.56 1.41537,1.06152 2.36749,2.85833 3.84,3.84 1.44848,0.96565 3.0123,1.58153 4.48,2.56 1.98671,1.32447 3.60423,4.24423 5.12,5.76 0.15085,0.15085 0.42667,0 0.64,0 0.64,0.64 1.37694,1.19592 1.92,1.92 0.128,0.17067 -0.15085,0.48915 0,0.64 0.15085,0.15085 0.4625,-0.11834 0.64,0 0.75309,0.50206 1.11046,1.51523 1.92,1.92 2.08157,1.04078 1.52235,0.16157 3.2,1.28 1.23077,0.82051 1.96923,2.37949 3.2,3.2 0.58415,0.38943 3.45144,1.53144 3.84,1.92 0.15085,0.15085 -0.15085,0.48915 0,0.64 0.29585,0.29585 1.53358,-0.19321 1.92,0 0.5397,0.26985 0.7403,1.01015 1.28,1.28 0.19081,0.0954 0.48915,-0.15085 0.64,0 0.33731,0.33731 0.30269,0.94269 0.64,1.28 1.33421,1.33421 7.13234,0.67078 8.96,1.28 0.72971,0.24324 1.23202,0.93601 1.92,1.28 0.76679,0.3834 4.29145,0.27618 5.12,0 0.72971,-0.24324 1.17378,-1.09345 1.92,-1.28 0.62089,-0.15522 1.28,0 1.92,0 1.06667,-0.21333 2.15406,-0.34116 3.2,-0.64 7.08222,-2.02349 14.21809,-8.58356 19.84,-12.8 1.96042,-1.47031 -1.04936,0.40936 1.28,-1.92 0.91268,-0.91268 2.20026,-0.53019 3.2,-1.28 0.38162,-0.28622 0.24309,-1.01539 0.64,-1.28 0.35501,-0.23667 0.89838,0.19081 1.28,0 3.21235,-1.60617 2.88657,-4.48 7.04,-4.48
                `
            ],
            [
                [0],
                [],
                0,
                true,
                false,
                [0.9, 0.1],
                [(window.innerWidth * 0.15), (window.innerHeight - window.innerHeight * 0.05)],
                `
                m 92.16,512
                c -13.253637,0.59955 1.893377,-7.39994 0,-10.24 -2.007342,-3.01101 -6.892224,-10.14112 -7.68,-14.08 -0.418381,-2.09191 0.517409,-4.33036 0,-6.4 0.771492,-2.31672 -2.073525,-2.38058 -2.56,-3.84 -0.921252,-2.76375 0.211504,-3.41699 -1.28,-6.4 -0.679733,-1.35947 0.376542,-3.61383 0,-5.12 -0.85558,-3.42232 -2.917636,-4.91291 -3.84,-7.68 -0.64,-1.92 0.64,-4.48 0,-6.4 -0.381622,-1.14487 -2.178378,-1.41513 -2.56,-2.56 -2.048,-6.144 2.048,-14.336 0,-20.48 -1.271412,-3.81424 -2.878394,-8.95357 -3.84,-12.8 -0.865511,-3.46204 0.245623,-7.13687 1.28,-10.24 1.664,-4.992 -1.664,-11.648 0,-16.64 0.381622,-1.14487 2.020305,-1.48061 2.56,-2.56 0.676405,-1.35281 0.218795,-7.8988 1.28,-8.96 0.301699,-0.3017 0.978301,0.3017 1.28,0 1.559019,-1.55902 0.59958,-2.85979 2.56,-3.84 1.765577,-0.88279 1.144925,1.55015 2.56,-1.28 3.413333,-6.82667 -3.84,3.84 1.28,-1.28 0.603398,-0.6034 -0.603398,-1.9566 0,-2.56 0.603398,-0.6034 1.956602,0.6034 2.56,0 0.586298,-0.5863 0.269268,-4.61463 1.28,-5.12 1.144867,-0.57243 2.695133,0.57243 3.84,0 1.714374,-0.85719 1.773605,-3.05361 2.56,-3.84 0.08021,-0.0802 5.792445,-3.53622 6.4,-3.84 1.024,-0.512 2.816,0.512 3.84,0 0.5397,-0.26985 0.7403,-1.01015 1.28,-1.28 0.76324,-0.38162 1.9566,0.6034 2.56,0 0.3017,-0.3017 -0.3017,-0.9783 0,-1.28 0.37066,-0.37066 8.58934,-0.37066 8.96,0 0.3017,0.3017 -0.3017,0.9783 0,1.28 0.35355,0.35355 3.57483,1.01483 3.84,1.28 0.3017,0.3017 -0.3017,0.9783 0,1.28 0.3017,0.3017 0.9783,-0.3017 1.28,0 0.3017,0.3017 -0.3017,0.9783 0,1.28 1.55902,1.55902 2.85979,0.59958 3.84,2.56 0.88212,1.76424 5.20343,8.87656 3.84,10.24 -0.3017,0.3017 -0.9783,-0.3017 -1.28,0 -1.29906,1.29906 1.04424,6.11363 0,7.68 -1.5719,2.35785 -5.23801,6.45901 -7.68,7.68 -0.38162,0.19081 -0.9783,-0.3017 -1.28,0 -0.64,0.64 0.64,3.2 0,3.84 -0.045,0.045 -3.38426,0.82426 -3.84,1.28 -0.6034,0.6034 0.6034,1.9566 0,2.56 -1.52575,1.52575 -8.31701,-0.9615 -10.24,0 -4.13692,2.06846 -11.205188,2.07741 -15.36,0 -1.375459,-0.68773 -3.639061,0.49365 -5.12,0 -4.684679,-1.56156 -0.535361,-2.18768 -3.84,-3.84 -0.763245,-0.38162 -1.796756,0.38162 -2.56,0 -2.622838,-1.31142 -3.596274,-5.39441 -5.12,-7.68 -2.457035,-3.68555 -6.323945,-8.73183 -7.68,-12.8 -0.68054,-2.04162 -0.548036,-4.20411 -1.28,-6.4 -0.870495,-2.61149 1.501911,-7.98713 0,-10.24 -0.66941,-1.00411 -1.89059,-1.55589 -2.56,-2.56 -0.916274,-1.37441 0.992118,-4.25635 1.28,-5.12 0.896,-2.688 -0.896,-6.272 0,-8.96 1.064126,-3.19238 2.476018,-2.39204 3.84,-5.12 1.088803,-2.17761 -1.241799,-2.5982 1.28,-5.12 0.301699,-0.3017 0.978301,0.3017 1.28,0 1.706667,-1.70667 -0.426667,-7.25333 1.28,-8.96 0.07945,-3.60414 2.885944,-0.32594 3.84,-1.28 2.573395,-2.5734 2.139848,-5.29588 5.12,-7.68 3.968596,-3.17488 8.554201,-5.02638 12.8,-7.68 3.794777,-0.63959 4.907298,-4.55153 7.68,-6.4 7.99058,-5.32705 2.13333,-0.42667 8.96,-3.84 1.02737,-0.51369 6.27666,-4.99666 6.4,-5.12 0.67462,-0.67462 0.60538,-1.88538 1.28,-2.56 0.3017,-0.3017 0.89838,0.19081 1.28,0 3.53898,-1.76949 6.70102,-4.63051 10.24,-6.4 1.2068,-0.6034 2.76061,-0.47046 3.84,-1.28 0.76324,-0.57243 0.51676,-1.98757 1.28,-2.56 3.09543,-2.32158 8.43173,-2.8038 11.52,-5.12 0.76324,-0.57243 0.60538,-1.88538 1.28,-2.56 2.21046,-2.21046 6.42873,-4.50155 8.96,-6.4 2.64649,-1.98487 6.20714,-2.00476 8.96,-3.84 1.00411,-0.66941 1.37664,-2.32333 2.56,-2.56 1.67352,-0.33471 3.43049,0.24136 5.12,0 3.93314,-0.56188 7.62037,-3.06007 11.52,-3.84 1.74341,-0.34868 4.81406,0.79297 6.4,0 3.2616,-1.6308 5.05904,-3.05981 8.96,-3.84 2.45145,-0.49029 4.43884,0.39223 6.4,0 3.38884,-0.67777 6.7287,-3.13774 10.24,-3.84 2.51029,-0.50206 5.13977,0.31753 7.68,0 8.48336,-1.06042 1.87543,-1.14309 8.96,-2.56 3.67083,-0.73417 7.89502,0.90625 11.52,0 1.85114,-0.46279 3.24894,-2.18579 5.12,-2.56 9.64892,-1.92978 25.70553,0.77957 35.84,0 16.12198,-1.24015 -1.91817,-0.64037 7.68,-2.56 6.15385,-1.23077 13.04615,1.23077 19.2,0 0.93553,-0.18711 1.61331,-1.16166 2.56,-1.28 10.58813,-1.32352 22.7962,0 33.28,0 8.96,0 17.92,0 26.88,0 3.39327,0 8.15637,0.84091 11.52,0 5.05778,-1.26445 0.20308,-4.58154 3.84,-6.4 1.024,-0.512 2.816,0.512 3.84,0 3.23092,-1.61546 6.2492,-1.28 10.24,-1.28
                `
            ],
            [
                [0],
                [],
                0,
                true,
                false,
                [0.9, 0.1],
                [(window.innerWidth * 0.43), (window.innerHeight * 0.2)],
                `
                m 225.28,0
                c 0.85333,1.28 1.28,4.6933333 2.56,3.84 1.28,-0.8533333 -3.04647,-5.2994245 -2.56,-3.84 2.5567,7.6701043 5.99671,11.186836 7.68,17.92 0.88008,3.520338 2.95992,6.719662 3.84,10.24 0.41393,1.65571 -0.41393,3.46429 0,5.12 0.69244,2.769762 1.99653,4.862656 2.56,7.68 1.52968,7.648407 5.12,10.075914 5.12,19.2 0,9.88202 -1.55909,29.045476 0,38.4 0.22181,1.330881 0.6766,2.6332 1.28,3.84 0.26985,0.5397 1.28,0.6766 1.28,1.28 0,0.42667 -0.9783,-0.3017 -1.28,0 -1.34924,1.34924 -2.09722,3.26886 -2.56,5.12 -0.0412,0.16479 0.38243,4.73757 0,5.12 -2.64837,2.64837 0.10353,-4.04705 -2.56,1.28 -0.38162,0.76324 0.38162,1.79676 0,2.56 -1.024,2.048 -4.096,3.072 -5.12,5.12 -0.19081,0.38162 0.3017,0.9783 0,1.28 -2.11194,2.11194 -5.46427,1.45214 -7.68,2.56 -1.07939,0.5397 -1.48061,2.0203 -2.56,2.56 -1.54788,0.77394 -6.8939,0.2922 -7.68,-1.28 -1.19467,-2.38933 1.19467,-6.57067 0,-8.96 -2.66353,-5.32705 0.0884,1.36837 -2.56,-1.28 -1.14102,-1.14102 -0.6003,-3.76061 -1.28,-5.12 -1.25554,-2.51107 -2.56,0.098 -2.56,-2.56 0,-3.41333 -0.42667,0.42667 1.28,-1.28 0.78639,-0.78639 0.84563,-2.98281 2.56,-3.84 1.14487,-0.57243 2.59822,0.31045 3.84,0 0.92557,-0.23139 1.6549,-0.9783 2.56,-1.28 2.95464,-0.98488 7.48782,1.37609 10.24,0 0.85333,-0.42667 0.42667,-2.13333 1.28,-2.56 0.52366,-0.26183 6.04147,-0.35853 6.4,0 3.46412,3.46412 0.62581,2.56 6.4,2.56 1.30672,0 4.09856,3.07711 5.12,5.12 0.38162,0.76324 -0.47334,1.84998 0,2.56 2.09102,3.13653 5.17673,5.29019 6.4,8.96 0.59514,1.78542 -0.36963,4.55187 0,6.4 0.89637,4.48185 4.51918,10.91918 7.68,14.08 0.42667,0.42667 3.41333,0.85333 3.84,1.28 0.29591,0.29591 0,32.10466 0,35.84 0,8.02036 -3.35617,9.5949 -7.68,15.36 -1.73079,2.30772 -2.93912,4.97736 -3.84,7.68 -0.13492,0.40477 0.38162,1.08919 0,1.28 -0.76324,0.38162 -1.84998,-0.47334 -2.56,0 -0.79382,0.52921 -0.60538,1.88538 -1.28,2.56 -1.18797,1.18797 -8.31852,2.87926 -10.24,3.84 -0.81938,0.40969 -4.59888,2.03888 -5.12,2.56 -0.3017,0.3017 0.3017,0.9783 0,1.28 -0.6034,0.6034 -1.75046,-0.26985 -2.56,0 -0.9051,0.3017 -1.70667,0.85333 -2.56,1.28 -11.49942,5.74971 -26.92508,4.31593 -37.12,-3.84 -0.74499,-0.59599 -0.60538,-1.88538 -1.28,-2.56 -0.6034,-0.6034 -1.79676,0.38162 -2.56,0 -2.3565,-1.17825 -0.2035,-2.66175 -2.56,-3.84 -0.76497,-0.38248 -2.56,0.84261 -2.56,-1.28 0,-0.1898 9.72402,0.25799 10.24,0 0.38162,-0.19081 -0.3017,-0.9783 0,-1.28 0.3017,-0.3017 0.9783,0.3017 1.28,0 0.6034,-0.6034 -0.6034,-3.1634 0,-2.56 3.08648,3.08648 1.77092,3.84 6.4,3.84 2.66039,0 1.36784,-0.0878 2.56,-1.28 1.02231,-1.02231 12.25458,-0.18181 12.8,0 0.9578,0.31927 6.38784,1.26784 6.4,1.28 2.64837,2.64837 -4.04705,-0.10353 1.28,2.56 1.83322,0.91661 6.02024,-0.37976 7.68,1.28 2.17682,2.17682 3.10552,4.38552 5.12,6.4 0.95406,0.95406 2.88594,0.32594 3.84,1.28 0.3017,0.3017 -0.3017,0.9783 0,1.28 1.08779,1.08779 2.75221,1.47221 3.84,2.56 0.3017,0.3017 -0.3017,0.9783 0,1.28 1.55902,1.55902 2.85979,0.59958 3.84,2.56 2.49878,4.99756 4.3747,9.39757 5.12,15.36 1.01199,8.09595 -0.28631,16.37051 -1.28,24.32 -2.08689,16.69509 -7.47582,24.85791 -21.76,32 -0.8711,0.43555 -5.68705,4.40705 -6.4,5.12 -0.3017,0.3017 0.3017,0.9783 0,1.28 -3.69036,3.69036 -11.4282,7.91764 -16.64,8.96 -2.8666,0.57332 -30.86731,1.20635 -33.28,0 -2.83149,-1.41575 -0.0987,-2.56 -3.84,-2.56
                `
            ],
            [
                [0],
                [],
                0,
                true,
                false,
                [0.9, 0.1],
                [(window.innerWidth * 0.8), (window.innerHeight * 0)],
                `
                m 222.08,0
                c 0.64,1.0666667 0.85333,3.84 1.92,3.2 1.06667,-0.64 -2.61001,-4.2350177 -1.92,-3.2 1.11638,1.67457 2.08362,3.44543 3.2,5.12 -0.1667,1.3521666 1.01539,0.2430888 1.28,0.64 0.37421,0.5613171 0.23523,1.3803046 0.64,1.92 0.56904,0.7587151 2.52347,1.2434661 3.2,1.92 0.8217,0.821704 0.63713,2.235694 1.28,3.2 0.88814,1.332206 2.75005,4.030048 3.84,5.12 0.15085,0.150849 0.48915,-0.150849 0.64,0 0.8217,0.821704 0.63713,2.235694 1.28,3.2 0.7615,1.14225 2.21261,2.450448 2.56,3.84 0.10348,0.413927 -0.19081,0.898378 0,1.28 0.26985,0.539695 0.90306,0.808825 1.28,1.28 0.48051,0.600632 0.93601,1.232021 1.28,1.92 0.0954,0.190811 -0.15085,0.489151 0,0.64 1.55443,1.554433 0.93979,-0.190315 1.92,1.28 1.2472,1.870806 2.42902,3.356272 3.84,5.12 1.11288,1.391102 2.04816,7.552649 2.56,9.6 0.39646,1.585829 2.12599,2.537979 2.56,3.84 0.13492,0.404772 -0.13492,0.875228 0,1.28 0.27472,0.824159 1.64528,1.735841 1.92,2.56 1.85289,5.558672 2.73029,18.648003 1.92,24.32 -0.37273,2.609111 -1.60467,4.011681 -2.56,6.4 -0.47732,1.193308 -0.49221,2.658322 -1.28,3.84 -1.24186,1.862788 -3.24452,3.266782 -4.48,5.12 -0.18047,0.270699 -0.69759,3.25759 -1.28,3.84 -0.62197,0.621968 -1.77327,0.246633 -2.56,0.64 -0.5397,0.269848 -0.70757,1.089189 -1.28,1.28 -0.40477,0.134924 -0.87523,-0.134924 -1.28,0 -0.65789,0.219296 -5.37788,4.60894 -6.4,5.12 -1.02755,0.51377 -2.20253,0.71002 -3.2,1.28 -0.5239,0.29937 -0.79728,0.91796 -1.28,1.28 -1.39765,1.04824 -3.45979,2.0066 -5.12,2.56 -0.49449,0.16483 -2.88818,0.32818 -3.2,0.64 -0.15085,0.15085 0.15085,0.48915 0,0.64 -0.75425,0.75425 -2.15405,-0.20919 -3.2,0 -5.789,1.1578 1.73839,0.0605 -1.92,1.28 -2.39925,0.79975 -5.81219,-0.31348 -8.32,0 -2.20352,0.27544 -3.65166,1.49833 -5.76,1.92 -5.74092,1.14818 -12.14361,-0.96273 -17.92,0 -4.2239,0.70398 -8.74919,0.98032 -12.8,-0.64 -1.63112,-0.65245 -10.58443,-4.77557 -10.88,-4.48 -0.62197,0.62197 0.31333,1.74332 0.64,2.56 0.35433,0.88582 1.04861,1.63443 1.28,2.56 0.10348,0.41393 -0.23667,0.92499 0,1.28 0.44935,0.67403 1.5825,0.9425 1.92,1.28 1.32418,1.32418 -2.02353,-0.0518 0.64,1.28 0.19081,0.0954 0.48915,-0.15085 0.64,0 0.3017,0.3017 -0.38162,1.08919 0,1.28 0.38162,0.19081 0.86607,-0.10348 1.28,0 0.42667,0.21333 0.85333,0.42667 1.28,0.64 0,0.21333 -0.1775,0.52166 0,0.64 1.12263,0.74842 2.6332,0.6766 3.84,1.28 1.25957,0.62979 1.67325,1.67325 2.56,2.56 0.019,0.019 7.02503,4.47501 7.04,4.48 0.40477,0.13492 0.89838,-0.19081 1.28,0 1.48395,0.74198 1.31332,1.95332 1.92,2.56 1.21302,1.21302 1.66083,0.25521 3.2,0.64 1.06446,0.26612 1.18558,1.92 2.56,1.92 5.23039,0 10.95281,1.75795 16,3.2 1.29733,0.37066 2.50912,1.05819 3.84,1.28 0.63129,0.10522 1.31284,-0.20239 1.92,0 5.66347,1.88782 -1.60065,0.83187 3.84,1.92 3.9905,0.7981 13.22645,0 17.92,0 6.24495,0 13.02363,0.72663 19.2,0 1.74714,-0.20555 3.38126,-1.0125 5.12,-1.28 6.58394,-1.01291 -0.18757,1.24216 6.4,-0.64 0.91735,-0.2621 1.63443,-1.04861 2.56,-1.28 0.82785,-0.20696 1.72324,0.16735 2.56,0 5.38859,-1.07772 0.0198,-0.01 2.56,-1.28 1.44403,-0.72201 3.59879,-0.5194 5.12,-1.28 2.08398,-1.04199 5.23049,-2.19471 7.04,-3.2 3.33549,-1.85305 6.20338,-4.5473 9.6,-6.4 4.69333,-2.56 -1.32548,1.95032 4.48,-1.92 0.50206,-0.3347 0.85333,-0.85333 1.28,-1.28 0.85333,-0.64 1.65547,-1.35467 2.56,-1.92 0.80904,-0.50565 1.81501,-0.68401 2.56,-1.28 0.3725,-0.298 0.30269,-0.94269 0.64,-1.28 0.81936,-0.81936 3.47317,-0.91317 4.48,-1.92 0.15085,-0.15085 0.21333,-0.64 0,-0.64 -0.21333,0 -0.15085,0.48915 0,0.64 0.15085,0.15085 0.48915,-0.15085 0.64,0 0.61439,0.61439 -0.40401,3.03199 0,3.84 0.4872,0.97441 1.28,0.37474 1.28,1.92 0,3.08594 -0.7928,-0.0288 -1.28,1.92 -0.15522,0.62089 0.20239,1.31284 0,1.92 -0.24324,0.72971 -0.99433,1.20583 -1.28,1.92 -1.28,3.2 0.64,0 0,1.92 -0.65603,1.9681 -1.56686,3.64118 -1.92,5.76 -0.28165,1.6899 0.35739,2.81769 -0.64,4.48 -1.36773,2.27954 -3.45059,4.31323 -5.12,6.4 -1.04276,1.30345 -1.12953,3.2943 -1.92,4.48 -0.67078,1.00616 -6.12545,8.77697 -6.4,8.96 -3.15396,2.10264 -6.58812,3.9905 -9.6,6.4 -1.22335,0.97868 -2.50575,2.39945 -3.84,3.2 -2.55038,1.53023 -5.61863,2.48932 -8.32,3.84 -0.26985,0.13492 -0.42667,0.42667 -0.64,0.64 -0.85333,0.42667 -1.66669,0.94501 -2.56,1.28 -9.89103,3.70914 -20.43465,5.39437 -30.72,7.68 -1.66603,0.37023 -3.41333,0 -5.12,0 -5.08182,0 -10.29393,-0.33774 -15.36,0 -2.21199,-0.92697 -3.80124,1.10193 -5.76,1.28 -1.69966,0.15451 -3.41711,-0.11353 -5.12,0 -4.2972,0.28648 -3.55278,0.90825 -7.04,0.64 -5.36443,-0.41265 -10.15054,-2.33176 -15.36,-3.2 -1.90553,-0.31759 -3.8657,-0.26114 -5.76,-0.64 -6.58067,-1.31613 -12.88299,-4.29433 -19.2,-6.4 -3.06416,-1.02139 -6.50369,-1.07555 -9.6,-1.92 -1.10835,-0.30228 -2.13333,-0.85333 -3.2,-1.28 -1.49333,-0.21333 -3.01655,-0.27414 -4.48,-0.64 -1.11453,-0.27863 -2.0697,-1.07449 -3.2,-1.28 -6.22787,-1.13234 -1.48,1.21333 -7.04,-0.64 -3.50922,-1.16974 -5.36433,-3.14955 -8.32,-5.12 -0.64,-0.42667 -1.28,-0.85333 -1.92,-1.28 -0.64,-0.21333 -1.33427,-0.3053 -1.92,-0.64 -2.45744,-1.40425 -4.6831,-3.54873 -7.04,-5.12 -0.90568,-0.60379 -5.07526,-3.24474 -5.12,-3.2 -0.15085,0.15085 0,0.42667 0,0.64 0,1.06667 -0.1323,2.14157 0,3.2 0.0837,0.66941 0.3383,1.3166 0.64,1.92 0.13492,0.26985 0.64,0.3383 0.64,0.64 0,2.17301 -1.99872,2.88511 -1.28,5.76 0.38729,1.54915 0.96368,1.28491 1.92,2.56 0.99124,1.32165 1.10569,3.12281 1.92,4.48 0.95949,1.59914 2.99849,2.79698 3.84,4.48 0.19081,0.38162 -0.13492,0.87523 0,1.28 0.37755,1.13266 1.73982,3.49578 2.56,4.48 2.62465,3.14958 6.09946,5.45946 8.96,8.32 2.89517,2.89517 -0.74773,1.42151 3.84,4.48 0.35501,0.23667 0.90955,-0.21169 1.28,0 2.88752,1.65001 4.37817,4.62544 7.04,6.4 0.56132,0.37421 1.28,0.42667 1.92,0.64 2.34667,1.92 4.57273,3.99766 7.04,5.76 0.54896,0.39211 1.35868,0.26579 1.92,0.64 2.30063,1.53376 4.09937,4.22624 6.4,5.76 0.56132,0.37421 1.28,0.42667 1.92,0.64 1.28,0.64 2.66761,1.09933 3.84,1.92 0.98865,0.69205 1.59456,1.83592 2.56,2.56 4.41185,3.30889 9.54439,5.81996 14.08,8.96 1.12311,0.77754 1.99728,1.91238 3.2,2.56 2.60127,0.97548 4.26579,1.39588 6.4,2.56 4.82717,2.633 9.6788,5.47447 14.72,7.68 1.25184,0.54768 5.47954,1.09591 6.4,1.28 5.07422,1.01484 10.34731,1.94683 15.36,3.2 2.16076,0.54019 4.23424,1.40022 6.4,1.92 3.17326,0.76158 6.44015,1.10455 9.6,1.92 3.46267,0.89359 6.76372,2.3609 10.24,3.2 2.72763,0.65839 5.55222,0.8187 8.32,1.28 37.39763,6.23294 -1.05713,0.37962 39.68,5.76 4.27725,0.56492 8.5595,1.12491 12.8,1.92 7.47342,1.40127 14.87099,4.04443 22.4,5.12 9.33685,1.33384 18.78706,0.23248 28.16,0.64 16.60487,0.72195 -2.10127,0.28408 13.44,1.92 4.45538,0.46899 8.98378,0.46099 13.44,0 5.7948,0.31893 11.03532,-2.49941 16.64,-3.2 3.18234,-0.39779 6.42513,-0.18645 9.6,-0.64 3.74228,-0.53461 7.21259,-2.28315 10.88,-3.2 3.62398,-0.906 7.35184,-1.38395 10.88,-2.56 2.09801,-0.69934 3.68863,-1.78324 5.76,-2.56 2.04832,-0.76812 4.41395,-0.92698 6.4,-1.92 0.68798,-0.34399 1.21301,-0.977 1.92,-1.28 3.37935,-1.44829 7.14254,-1.51691 10.24,-3.84 0.61535,-0.46151 0.65409,-1.47292 1.28,-1.92 2.20097,-1.57212 3.06458,-0.89229 5.12,-1.92 5.42226,-2.71113 11.50216,-5.05046 16.64,-8.32 5.34421,-3.40086 10.42312,-7.45156 16,-10.24 0.73155,-0.36577 2.63931,-1.35931 3.2,-1.92 0.15085,-0.15085 -0.19081,-0.54459 0,-0.64 0.38162,-0.19081 0.87523,0.13492 1.28,0 0.91393,-0.30464 1.58517,-1.72503 2.56,-1.92 0.83676,-0.16735 1.70667,0 2.56,0
                `
            ],
            [
                [0],
                [],
                0,
                true,
                false,
                [0.9, 0.1],
                [(window.innerWidth * 0.23), (window.innerHeight * 0.2)],
                `
                m 352,0
                c 1.70667,2.9866667 3.1206,6.160841 5.12,8.96 0.24799,0.3471929 0.92499,-0.2366721 1.28,0 1.00411,0.6694097 1.83592,1.594564 2.56,2.56 2.92007,3.89343 4.9746,8.741901 7.68,12.8 1.44959,2.174379 4.41549,5.214215 5.12,7.68 0.46886,1.641001 -0.41393,3.46429 0,5.12 0.46278,1.85114 1.85135,3.348363 2.56,5.12 1.12707,2.817664 0.79174,6.030467 1.28,8.96 0.57017,3.421028 3.0396,5.758382 3.84,8.96 1.13554,4.542174 2.29699,9.450962 3.84,14.08 0.78673,2.360203 3.05327,4.039797 3.84,6.4 0.40477,1.214315 -0.21043,2.577416 0,3.84 0.78529,4.711725 3.04528,9.311678 3.84,14.08 0.491,2.94603 -0.32982,5.9916 0,8.96 0.41224,3.71019 1.87633,6.82165 2.56,10.24 0.25103,1.25514 -0.40477,2.62569 0,3.84 6.25697,18.7709 -0.51252,-9.73007 3.84,7.68 0.41393,1.65571 -0.28057,3.43655 0,5.12 1.87268,11.23606 0.47085,-1.9566 2.56,6.4 1.31434,5.25734 0.48032,27.67713 0,32 -0.55457,4.99109 -2.90412,9.40061 -3.84,14.08 -0.25103,1.25514 0.44944,2.6415 0,3.84 -0.87355,2.32947 -2.96645,4.07053 -3.84,6.4 -0.44944,1.1985 0.43743,2.63706 0,3.84 -2.77863,7.64124 -7.47537,13.73895 -11.52,20.48 -1.47031,2.45052 -1.50606,0.22606 -3.84,2.56 -3.92883,3.92883 0.74786,1.06429 -1.28,5.12 -0.95406,1.90811 -2.47427,3.48113 -3.84,5.12 -3.46001,4.15201 -7.96078,7.45232 -11.52,11.52 -1.79903,2.05604 -3.18818,4.46818 -5.12,6.4 -1.93182,1.93182 -4.46818,3.18818 -6.4,5.12 -1.08779,1.08779 -1.35874,2.87899 -2.56,3.84 -1.74135,1.39308 -12.48609,5.76406 -15.36,7.68 -0.35501,0.23667 0.3017,0.9783 0,1.28 -1.28,0.85333 -2.56,1.70667 -3.84,2.56 -0.42667,0 -0.91414,-0.21952 -1.28,0 -6.97833,4.187 -13.2029,10.44145 -20.48,14.08 -14.39786,7.19893 0.70199,-1.0488 -11.52,3.84 -0.56024,0.2241 -0.85333,0.85333 -1.28,1.28 -0.85333,0.42667 -1.6549,0.9783 -2.56,1.28 -3.86558,1.28853 -8.89483,1.25828 -12.8,2.56 -2.02386,0.67462 -3.15916,2.99964 -5.12,3.84 -4.25377,1.82304 -9.71599,3.48349 -14.08,5.12 -6.5332,2.44995 -13.78889,2.26562 -20.48,3.84 -4.33612,1.02026 -8.57406,2.43135 -12.8,3.84 -0.9051,0.3017 -1.61068,1.18507 -2.56,1.28 -3.39639,0.33964 -6.85005,-0.39882 -10.24,0 -5.50608,0.64777 -16.15479,3.99896 -21.76,5.12 -13.65565,2.73113 -37.15098,5.59613 -51.2,3.84 -9.57745,-1.19718 -17.69933,-5.17618 -26.88,-7.68 -6.02449,-1.64304 -7.73787,-1.09643 -14.08,-2.56 -4.740168,-1.09389 -9.245006,-3.30278 -14.08,-3.84 -2.120285,-0.23559 -4.356637,0.61301 -6.4,0 -2.133333,-1.28 -4.266667,-2.56 -6.4,-3.84 0,-0.42667 0.355008,-1.04333 0,-1.28 -3.655032,-2.43669 -7.68,-4.26667 -11.52,-6.4 -7.461747,-4.14542 -15.669271,-7.42515 -23.04,-11.52 -3.701587,-2.05644 -12.151711,-9.01592 -16.64,-10.24 -8.05609,0 -6.146881,0.62089 -12.8,-1.28
                C 6.433544,273.19816 2.5893107,271.36 0,271.36
                `
            ]

        ],
        "animation_class" : [
            "animated-leaf-animation-beginning",
            "animated-leaf-animation-ending"
        ]

    },

    "preview_before_first_launch" : false,
    "time_before_first_launch" : 1000,
    "first_level_animation_speeds_list" : [2000],
    "pause_between_animations_list" : [1000],
    "global_animation_repetition_number" : 1,
    "hasAnimationPageSubElements" : false,
    "animation_page_effect_class_to_activate" : "animation-page-3-effect-class"

};








const animation_page_4 = {

    "animated-left-wheat" : {

        "left-wheat" : [
            [
                [0],
                [],
                0,
                true,
                true,
                [0.9, 0.1],
                [(window.innerWidth * 0.5) - 52 * rem, (window.innerHeight * 0.5) + 15 * rem],
                `
                m 221.29614,160.65466
                c 2.34254,-0.68091 4.81876,-0.45255 7.24077,-0.45255 4.37464,0 8.74927,0 13.1239,0 1.48107,0 3.57124,0.40194 4.97804,0 1.73864,-0.49675 3.2032,-1.1041 4.97803,-1.35764 0.448,-0.064 0.91861,0.10976 1.35764,0 1.98213,-0.49553 3.26641,-1.40693 4.97803,-2.26274 0.1243,-0.0622 3.65145,-0.45255 4.07294,-0.45255
                `
            ],
            [
                [0],
                [],
                0,
                true,
                true,
                [0.9, 0.1],
                [(window.innerWidth * 0.5) - 50 * rem, (window.innerHeight * 0.5) + 14 * rem],
                `
                m 221.29614,160.65466
                c 2.34254,-0.68091 4.81876,-0.45255 7.24077,-0.45255 4.37464,0 8.74927,0 13.1239,0 1.48107,0 3.57124,0.40194 4.97804,0 1.73864,-0.49675 3.2032,-1.1041 4.97803,-1.35764 0.448,-0.064 0.91861,0.10976 1.35764,0 1.98213,-0.49553 3.26641,-1.40693 4.97803,-2.26274 0.1243,-0.0622 3.65145,-0.45255 4.07294,-0.45255
                `
            ],
            [
                [0],
                [],
                0,
                true,
                true,
                [0.9, 0.1],
                [(window.innerWidth * 0.5) - 47 * rem, (window.innerHeight * 0.5) + 16 * rem],
                `
                m 221.29614,160.65466
                c 2.34254,-0.68091 4.81876,-0.45255 7.24077,-0.45255 4.37464,0 8.74927,0 13.1239,0 1.48107,0 3.57124,0.40194 4.97804,0 1.73864,-0.49675 3.2032,-1.1041 4.97803,-1.35764 0.448,-0.064 0.91861,0.10976 1.35764,0 1.98213,-0.49553 3.26641,-1.40693 4.97803,-2.26274 0.1243,-0.0622 3.65145,-0.45255 4.07294,-0.45255
                `
            ]
        ],
        "animation_class" : [
            "animated-left-wheat-animation-beginning",
            "animated-left-wheat-animation-ending"
        ]

    },
    "animated-right-wheat" : {

        "right-wheat" : [
            [
                [0],
                [],
                0,
                true,
                true,
                [0.9, 0.1],
                [(window.innerWidth * 0.5) + 48 * rem, (window.innerHeight * 0.5) + 15 * rem],
                `
                m 221.29614,160.65466
                c 2.34254,-0.68091 4.81876,-0.45255 7.24077,-0.45255 4.37464,0 8.74927,0 13.1239,0 1.48107,0 3.57124,0.40194 4.97804,0 1.73864,-0.49675 3.2032,-1.1041 4.97803,-1.35764 0.448,-0.064 0.91861,0.10976 1.35764,0 1.98213,-0.49553 3.26641,-1.40693 4.97803,-2.26274 0.1243,-0.0622 3.65145,-0.45255 4.07294,-0.45255
                `
            ],
            [
                [0],
                [],
                0,
                true,
                true,
                [0.9, 0.1],
                [(window.innerWidth * 0.5) + 46 * rem, (window.innerHeight * 0.5) + 14 * rem],
                `
                m 221.29614,160.65466
                c 2.34254,-0.68091 4.81876,-0.45255 7.24077,-0.45255 4.37464,0 8.74927,0 13.1239,0 1.48107,0 3.57124,0.40194 4.97804,0 1.73864,-0.49675 3.2032,-1.1041 4.97803,-1.35764 0.448,-0.064 0.91861,0.10976 1.35764,0 1.98213,-0.49553 3.26641,-1.40693 4.97803,-2.26274 0.1243,-0.0622 3.65145,-0.45255 4.07294,-0.45255
                `
            ],
            [
                [0],
                [],
                0,
                true,
                true,
                [0.9, 0.1],
                [(window.innerWidth * 0.5) + 43 * rem, (window.innerHeight * 0.5) + 16 * rem],
                `
                m 221.29614,160.65466
                c 2.34254,-0.68091 4.81876,-0.45255 7.24077,-0.45255 4.37464,0 8.74927,0 13.1239,0 1.48107,0 3.57124,0.40194 4.97804,0 1.73864,-0.49675 3.2032,-1.1041 4.97803,-1.35764 0.448,-0.064 0.91861,0.10976 1.35764,0 1.98213,-0.49553 3.26641,-1.40693 4.97803,-2.26274 0.1243,-0.0622 3.65145,-0.45255 4.07294,-0.45255
                `
            ]
        ],
        "animation_class" : [
            "animated-right-wheat-animation-beginning",
            "animated-right-wheat-animation-ending"
        ]

    },
    "animated-cloud" : {

        "cloud" : [
            [
                [0],
                [],
                0,
                false,
                true,
                [0.9, 0.1],
                [(window.innerWidth * 0.5) - 20 * rem, (window.innerHeight * 0.5) - 20 * rem],
                `
                m 221.29614,160.65466
                c 2.34254,-0.68091 4.81876,-0.45255 7.24077,-0.45255 4.37464,0 8.74927,0 13.1239,0 1.48107,0 3.57124,0.40194 4.97804,0 1.73864,-0.49675 3.2032,-1.1041 4.97803,-1.35764 0.448,-0.064 0.91861,0.10976 1.35764,0 1.98213,-0.49553 3.26641,-1.40693 4.97803,-2.26274 0.1243,-0.0622 3.65145,-0.45255 4.07294,-0.45255
                `
            ],
            [
                [0],
                [],
                0,
                false,
                true,
                [0.9, 0.1],
                [(window.innerWidth * 0.5) - 28 * rem, (window.innerHeight * 0.5) - 21 * rem],
                `
                m 221.29614,160.65466
                c 2.34254,-0.68091 4.81876,-0.45255 7.24077,-0.45255 4.37464,0 8.74927,0 13.1239,0 1.48107,0 3.57124,0.40194 4.97804,0 1.73864,-0.49675 3.2032,-1.1041 4.97803,-1.35764 0.448,-0.064 0.91861,0.10976 1.35764,0 1.98213,-0.49553 3.26641,-1.40693 4.97803,-2.26274 0.1243,-0.0622 3.65145,-0.45255 4.07294,-0.45255
                `
            ],
            [
                [0],
                [],
                0,
                false,
                true,
                [0.9, 0.1],
                [(window.innerWidth * 0.5) - 48 * rem, (window.innerHeight * 0.5) - 18 * rem],
                `
                m 221.29614,160.65466
                c 2.34254,-0.68091 4.81876,-0.45255 7.24077,-0.45255 4.37464,0 8.74927,0 13.1239,0 1.48107,0 3.57124,0.40194 4.97804,0 1.73864,-0.49675 3.2032,-1.1041 4.97803,-1.35764 0.448,-0.064 0.91861,0.10976 1.35764,0 1.98213,-0.49553 3.26641,-1.40693 4.97803,-2.26274 0.1243,-0.0622 3.65145,-0.45255 4.07294,-0.45255
                `
            ],
            [
                [0],
                [],
                0,
                false,
                true,
                [0.9, 0.1],
                [(window.innerWidth * 0.5) - 46 * rem, (window.innerHeight * 0.5) - 16 * rem],
                `
                m 221.29614,160.65466
                c 2.34254,-0.68091 4.81876,-0.45255 7.24077,-0.45255 4.37464,0 8.74927,0 13.1239,0 1.48107,0 3.57124,0.40194 4.97804,0 1.73864,-0.49675 3.2032,-1.1041 4.97803,-1.35764 0.448,-0.064 0.91861,0.10976 1.35764,0 1.98213,-0.49553 3.26641,-1.40693 4.97803,-2.26274 0.1243,-0.0622 3.65145,-0.45255 4.07294,-0.45255
                `
            ],
            [
                [0],
                [],
                0,
                false,
                true,
                [0.9, 0.1],
                [(window.innerWidth * 0.5) + 19 * rem, (window.innerHeight * 0.5) - 26 * rem],
                `
                m 221.29614,160.65466
                c 2.34254,-0.68091 4.81876,-0.45255 7.24077,-0.45255 4.37464,0 8.74927,0 13.1239,0 1.48107,0 3.57124,0.40194 4.97804,0 1.73864,-0.49675 3.2032,-1.1041 4.97803,-1.35764 0.448,-0.064 0.91861,0.10976 1.35764,0 1.98213,-0.49553 3.26641,-1.40693 4.97803,-2.26274 0.1243,-0.0622 3.65145,-0.45255 4.07294,-0.45255
                `
            ],
            [
                [0],
                [],
                0,
                false,
                true,
                [0.9, 0.1],
                [(window.innerWidth * 0.5) + 22 * rem, (window.innerHeight * 0.5) - 24 * rem],
                `
                m 221.29614,160.65466
                c 2.34254,-0.68091 4.81876,-0.45255 7.24077,-0.45255 4.37464,0 8.74927,0 13.1239,0 1.48107,0 3.57124,0.40194 4.97804,0 1.73864,-0.49675 3.2032,-1.1041 4.97803,-1.35764 0.448,-0.064 0.91861,0.10976 1.35764,0 1.98213,-0.49553 3.26641,-1.40693 4.97803,-2.26274 0.1243,-0.0622 3.65145,-0.45255 4.07294,-0.45255
                `
            ],
            [
                [0],
                [],
                0,
                false,
                true,
                [0.9, 0.1],
                [(window.innerWidth * 0.5) + 45 * rem, (window.innerHeight * 0.5) - 15 * rem],
                `
                m 221.29614,160.65466
                c 2.34254,-0.68091 4.81876,-0.45255 7.24077,-0.45255 4.37464,0 8.74927,0 13.1239,0 1.48107,0 3.57124,0.40194 4.97804,0 1.73864,-0.49675 3.2032,-1.1041 4.97803,-1.35764 0.448,-0.064 0.91861,0.10976 1.35764,0 1.98213,-0.49553 3.26641,-1.40693 4.97803,-2.26274 0.1243,-0.0622 3.65145,-0.45255 4.07294,-0.45255
                `
            ],
            [
                [0],
                [],
                0,
                false,
                true,
                [0.9, 0.1],
                [(window.innerWidth * 0.5) + 47 * rem, (window.innerHeight * 0.5) - 19 * rem],
                `
                m 221.29614,160.65466
                c 2.34254,-0.68091 4.81876,-0.45255 7.24077,-0.45255 4.37464,0 8.74927,0 13.1239,0 1.48107,0 3.57124,0.40194 4.97804,0 1.73864,-0.49675 3.2032,-1.1041 4.97803,-1.35764 0.448,-0.064 0.91861,0.10976 1.35764,0 1.98213,-0.49553 3.26641,-1.40693 4.97803,-2.26274 0.1243,-0.0622 3.65145,-0.45255 4.07294,-0.45255
                `
            ]
        ],
        "animation_class" : [
            "animated-cloud-animation-beginning",
            "animated-cloud-animation-ending"
        ]

    },
    "animated-butterfly-1" : {

        "butterfly-1" : [
            [
                [0],
                [],
                0,
                true,
                true,
                [0.7, 0.3],
                [(window.innerWidth * 0.5) + 43 * rem, (window.innerHeight * 0.5) - 2 * rem],
                `
                m 228.53691,296.87171
                c 0,0 -105.44376,-13.57645 0,-36.20387 0,0 -52.21691,45.25216 -44.85691,-8.82784 0,0 -5.44,-49.6 44.48,0.64 0,0 -61.12,7.36 -42.56,-42.56 0,0 19.2,-22.08 43.84,-0.32 0,0 -45.76,22.72 -44.48,-20.16 0.96,-1.28 -8.96,-18.24 44.48,-15.36
                `
            ]
        ],
        "animation_class" : [
            "animated-butterfly-1-animation-beginning",
            "animated-butterfly-1-animation-ending"
        ]

    },
    "animated-butterfly-2" : {

        "butterfly-2" : [
            [
                [0],
                [],
                0,
                true,
                true,
                [0.9, 0.1],
                [(window.innerWidth * 0.5) + 43 * rem, (window.innerHeight * 0.5) - 2 * rem],
                `
                m 239.39807,296.87171
                c 0,0 102.27593,-9.72979 0.67882,-36.65641 0,0 35.29878,47.2913 43.67092,-6.56196 0,0 -3.16784,-45.4811 -43.89719,-1.13137 0,0 56.79482,11.76626 43.21837,-39.59798 0,0 -18.10194,-28.05799 -43.44464,-3.62038 0,0 40.95562,21.49604 43.67091,-20.81723 0,0 4.86485,-19.88092 -43.89719,-15.16037
                `
            ]
        ],
        "animation_class" : [
            "animated-butterfly-2-animation-beginning",
            "animated-butterfly-2-animation-ending"
        ]

    },
    "animated-flying-bird" : {

        "flying-bird" : [
            [
                [2, [3000, 2000], ["flying-bird-trajectory-1", "flying-bird-trajectory-2"]],
                [],
                0,
                false,
                false,
                [0.7, 0.3],
                [(window.innerWidth * 0.5) + 31 * rem, (window.innerHeight * 0.5) - 15 * rem],
                `
                m 330.24,257.28
                c 0,0 -140.8,-17.92 -160.64,-64
                `
            ]
        ],
        "animation_class" : [
            "animated-flying-bird-animation-beginning",
            "animated-flying-bird-animation-ending"
        ]

    },
    "animated-shooting-star" : {

        "shooting-star" : [
            [
                [0],
                [],
                0,
                false,
                false,
                [0.9, 0.1],
                [(window.innerWidth * 0.5) + 11 * rem, (window.innerHeight * 0.5) - 18 * rem],
                `
                m 387.38138,228.98946
                c 0,0 -223.55888,-65.16696 -239.85062,-57.92619
                `
            ]
        ],
        "animation_class" : [
            "animated-shooting-star-animation-beginning",
            "animated-shooting-star-animation-ending"
        ]

    },
    "animated-star-1" : {

        "star-1" : [
            [
                [0],
                [],
                0,
                true,
                true,
                [0.8, 0.2],
                [(window.innerWidth * 0.5) + 11 * rem, (window.innerHeight * 0.5) - 15 * rem],
                `
                M 0 0 H 2
                `
            ],
            [
                [0],
                [],
                0,
                true,
                true,
                [0.3, 0.4],
                [(window.innerWidth * 0.5) + 20 * rem, (window.innerHeight * 0.5) - 10 * rem],
                `
                M 0 0 H 2
                `
            ],
            [
                [0],
                [],
                0,
                true,
                true,
                [0.5, 0.1],
                [(window.innerWidth * 0.5) - 2 * rem, (window.innerHeight * 0.5) - 13 * rem],
                `
                M 0 0 H 2
                `
            ],
            [
                [0],
                [],
                0,
                true,
                true,
                [0.9, 0.5],
                [(window.innerWidth * 0.5) - 30 * rem, (window.innerHeight * 0.5) - 10 * rem],
                `
                M 0 0 H 2
                `
            ],
            [
                [0],
                [],
                0,
                true,
                true,
                [0.7, 0.3],
                [(window.innerWidth * 0.5) - 25 * rem, (window.innerHeight * 0.5) - 13 * rem],
                `
                M 0 0 H 2
                `
            ],
            [
                [0],
                [],
                0,
                true,
                true,
                [0.5, 0.5],
                [(window.innerWidth * 0.5) - 40 * rem, (window.innerHeight * 0.5) - 20 * rem],
                `
                M 0 0 H 2
                `
            ],
            [
                [0],
                [],
                0,
                true,
                true,
                [0.6, 0.9],
                [(window.innerWidth * 0.5) - 52 * rem, (window.innerHeight * 0.5) - 13 * rem],
                `
                M 0 0 H 2
                `
            ]
        ],
        "animation_class" : [
            "animated-star-1-animation-beginning",
            "animated-star-1-animation-ending"
        ]

    },
    "animated-star-2" : {

        "star-2" : [
            [
                [0],
                [],
                0,
                true,
                true,
                [0.3, 0.3],
                [(window.innerWidth * 0.5) + 47 * rem, (window.innerHeight * 0.5) - 20 * rem],
                `
                M 0 0 H 2
                `
            ],
            [
                [0],
                [],
                0,
                true,
                true,
                [0.6, 0.1],
                [(window.innerWidth * 0.5) + 37 * rem, (window.innerHeight * 0.5) - 16 * rem],
                `
                M 0 0 H 2
                `
            ],
            [
                [0],
                [],
                0,
                true,
                true,
                [0.1, 0.9],
                [(window.innerWidth * 0.5) + 14 * rem, (window.innerHeight * 0.5) - 12 * rem],
                `
                M 0 0 H 2
                `
            ],
            [
                [0],
                [],
                0,
                true,
                true,
                [0.3, 0.1],
                [(window.innerWidth * 0.5) + 2 * rem, (window.innerHeight * 0.5) - 17 * rem],
                `
                M 0 0 H 2
                `
            ],
            [
                [0],
                [],
                0,
                true,
                true,
                [0.8, 0.2],
                [(window.innerWidth * 0.5) - 18 * rem, (window.innerHeight * 0.5) - 11 * rem],
                `
                M 0 0 H 2
                `
            ],
            [
                [0],
                [],
                0,
                true,
                true,
                [0.4, 0.7],
                [(window.innerWidth * 0.5) - 33 * rem, (window.innerHeight * 0.5) - 19 * rem],
                `
                M 0 0 H 2
                `
            ],
            [
                [0],
                [],
                0,
                true,
                true,
                [0.7, 0.2],
                [(window.innerWidth * 0.5) - 48 * rem, (window.innerHeight * 0.5) - 19 * rem],
                `
                M 0 0 H 2
                `
            ],
            [
                [0],
                [],
                0,
                true,
                true,
                [0.2, 0.5],
                [(window.innerWidth * 0.5) - 56 * rem, (window.innerHeight * 0.5) - 10 * rem],
                `
                M 0 0 H 2
                `
            ]
        ],
        "animation_class" : [
            "animated-star-2-animation-beginning",
            "animated-star-2-animation-ending"
        ]

    },
    "animated-pink-petal" : {

        "pink-petal" : [
            [
                [0],
                [],
                0,
                true,
                false,
                [0.9, 0.1],
                [(window.innerWidth * 0.5) + 42 * rem, (window.innerHeight * 0.5) + 1 * rem],
                `
                m 262.93059,139.38489
                c 0,0 -84.62654,21.72232 37.10896,101.37083 0,0 -8.59842,-76.48067 -42.087,-0.9051 0,0 -39.3717,93.22496 23.98507,74.21793 0,0 -1.35765,-21.72232 -12.21881,-15.83919 0,0 -20.81722,3.16783 -10.40861,40.2768 0,0 15.83919,52.94815 37.56151,41.1819 0,0 -14.93409,-16.29174 -16.74429,2.71529 0,0 9.05097,20.36467 20.36468,17.19683
                `
            ],
            [
                [2, [1000, 1000], ["petal-trajectory", "petal-trajectory"]],
                [],
                0,
                true,
                false,
                [0.5, 0.1],
                [(window.innerWidth * 0.5) + 43 * rem, (window.innerHeight * 0.5) + 5 * rem],
                `
                m 309.99561,154.31898
                c 0,0 27.1529,51.13796 8.59842,68.78735 0,0 -17.64938,-4.07293 -14.48155,-23.98506 0,0 25.34271,17.19684 24.89016,57.02109 0,0 -11.07779,32.13132 -20.81722,3.62039 0,0 24.43761,4.97803 23.98506,47.51757 0,0 -11.31371,1.8102 -15.83919,-7.69332 0,0 34.84622,-9.50351 23.07997,58.83129 0,0 -18.55449,0 -17.64939,-8.59842 0,0 36.20387,6.78822 31.67838,38.91915
                `
            ]
        ],
        "animation_class" : [
            "animated-pink-petal-animation-beginning",
            "animated-pink-petal-animation-ending"
        ]

    },
    "animated-blue-petal" : {

        "blue-petal" : [
            [
                [2, [2000, 1500], ["petal-trajectory", "petal-trajectory"]],
                [],
                0,
                true,
                false,
                [0.9, 0.1],
                [(window.innerWidth * 0.5) + 30 * rem, (window.innerHeight * 0.5) - 1 * rem],
                `
                m 125.44,108.16
                c 0,0 -1.28,112 23.04,85.12 0,0 -31.36,-61.44 1.92,90.24 0,0 10.24,48 -7.04,98.56
                `
            ]
        ],
        "animation_class" : [
            "animated-blue-petal-animation-beginning",
            "animated-blue-petal-animation-ending"
        ]

    },
    "animated-green-petal" : {

        "green-petal" : [
            [
                [3, [1500, 1000, 1000], ["petal-trajectory", "petal-trajectory", "petal-trajectory"]],
                [],
                0,
                true,
                false,
                [0.1, 0.1],
                [(window.innerWidth * 0.5) - 43 * rem, (window.innerHeight * 0.5) - 1 * rem],
                `
                m 125.44,108.16
                c 0,0 -1.28,112 23.04,85.12 0,0 -31.36,-61.44 1.92,90.24 0,0 10.24,48 -7.04,98.56
                `
            ]
        ],
        "animation_class" : [
            "animated-green-petal-animation-beginning",
            "animated-green-petal-animation-ending"
        ]

    },
    "animated-0-bit" : {

        "0-bit" : [
            [
                [0],
                [],
                0,
                false,
                false,
                [0.7, 0.1],
                [(window.innerWidth * 0.5) - 42 * rem, (window.innerHeight * 0.5) + 22 * rem],
                `
                M 270.62391,294.15642
                V 174.68366
                `
            ],
            [
                [0],
                [],
                0,
                false,
                false,
                [0.5, 0.1],
                [(window.innerWidth * 0.5) - 43 * rem, (window.innerHeight * 0.5) + 15 * rem],
                `
                M 270.62391,294.15642
                V 174.68366
                `
            ],
            [
                [0],
                [],
                0,
                false,
                false,
                [0.3, 0.1],
                [(window.innerWidth * 0.5) - 33 * rem, (window.innerHeight * 0.5) + 18 * rem],
                `
                M 270.62391,294.15642
                V 174.68366
                `
            ]
        ],
        "animation_class" : [
            "animated-0-bit-animation-beginning",
            "animated-0-bit-animation-ending"
        ]

    },
    "animated-1-bit" : {

        "1-bit" : [
            [
                [0],
                [],
                0,
                false,
                false,
                [0.7, 0.1],
                [(window.innerWidth * 0.5) - 41 * rem, (window.innerHeight * 0.5) + 18 * rem],
                `
                M 270.62391,294.15642
                V 174.68366
                `
            ],
            [
                [0],
                [],
                0,
                false,
                false,
                [0.4, 0.1],
                [(window.innerWidth * 0.5) - 34 * rem, (window.innerHeight * 0.5) + 21 * rem],
                `
                M 270.62391,294.15642
                V 174.68366
                `
            ],
            [
                [0],
                [],
                0,
                false,
                false,
                [0.3, 0.1],
                [(window.innerWidth * 0.5) - 34 * rem, (window.innerHeight * 0.5) + 8 * rem],
                `
                M 270.62391,294.15642
                V 174.68366
                `
            ]
        ],
        "animation_class" : [
            "animated-1-bit-animation-beginning",
            "animated-1-bit-animation-ending"
        ]

    },
    "animated-c-letter" : {

        "c-letter" : [
            [
                [0],
                [],
                0,
                false,
                false,
                [0.9, 0.1],
                [(window.innerWidth * 0.5) + 33 * rem, (window.innerHeight * 0.5) - 8 * rem],
                `
                m 286.99706,258.92857
                c 0,0 -55.49121,29.07658 -53.2388,-20.68122 0,0 28.05275,-55.08169 53.2388,20.68122
                z
                `
            ]
        ],
        "animation_class" : [
            "animated-c-letter-animation-beginning",
            "animated-c-letter-animation-ending"
        ]

    },
    "animated-plus-symbol" : {

        "plus-symbol" : [
            [
                [0],
                [],
                0,
                false,
                false,
                [0.9, 0.1],
                [(window.innerWidth * 0.5) + 31 * rem, (window.innerHeight * 0.5) - 8 * rem],
                `
                m 257.92561,267.34151
                c 0,0 -25.92909,4.51319 -24.16735,-29.09416 0,0 27.27586,-54.95021 53.2388,20.68122 0,0 -14.34584,7.27445 -29.07145,8.41294
                z
                `
            ],
            [
                [0],
                [],
                0,
                false,
                false,
                [0.9, 0.1],
                [(window.innerWidth * 0.5) + 29 * rem, (window.innerHeight * 0.5) - 10 * rem],
                `
                m 233.75826,238.24735
                c 0,0 27.43586,-55.27021 53.2388,20.68122 0,0 -54.52054,28.92613 -53.2388,-20.68122
                `
            ]
        ],
        "animation_class" : [
            "animated-plus-symbol-animation-beginning",
            "animated-plus-symbol-animation-ending"
        ]

    },
    "animated-react-logo" : {

        "react-logo" : [
            [
                [0],
                [],
                0,
                false,
                false,
                [0.9, 0.1],
                [(window.innerWidth * 0.5) - 30 * rem, (window.innerHeight * 0.5) - 8 * rem],
                `
                m 287.26697,231.73465
                a 25.871338,41.860703 0 0 1 -25.87134,41.8607 25.871338,41.860703 0 0 1 -25.87134,-41.8607 25.871338,41.860703 0 0 1 25.87134,-41.8607 25.871338,41.860703 0 0 1 25.87134,41.8607
                z
                `
            ]
        ],
        "animation_class" : [
            "animated-react-logo-animation-beginning",
            "animated-react-logo-animation-ending"
        ]

    },

    "preview_before_first_launch" : false,
    "time_before_first_launch" : 2000,
    "first_level_animation_speeds_list" : [10000],
    "pause_between_animations_list" : [10],
    "global_animation_repetition_number" : -1,
    "hasAnimationPageSubElements" : false,
    "animation_page_effect_class_to_activate" : ""

};
















const animation_page_list = [animation_page_1, animation_page_2, animation_page_3, animation_page_4];

const index_state = {animation_page_list_index : 0};
const raf_ids_list_state = {raf_ids_list : []};

const original_window_outerwidth = window.outerWidth;

function resize_container() {

    const scaleX = window.innerWidth / original_window_outerwidth;

    container.style.transform = `scaleX(${scaleX})`;
}

window.addEventListener('resize', resize_container);
window.addEventListener('DOMContentLoaded', resize_container);




const open_projects = () => {

    const animated_map_container = document.getElementById("animated-map-container");

    if (animated_map_container) {

        localStorage.setItem("animated-map-container-scrolling-level", animated_map_container.scrollTop);

        for (let i = animated_map_container.children.length - 1 ; i >= 0 ; --i) {

            animated_map_container.removeChild(animated_map_container.children[i]);
        }

        const animated_map_container_content = document.createElement("div");
        animated_map_container_content.classList.add("animated-map-container-content");

        const animated_map_container_content_back_button = document.createElement("button");
        animated_map_container_content_back_button.id = "animated-map-container-content-back-button";
        animated_map_container_content.appendChild(animated_map_container_content_back_button);

        const title_0 = document.createElement("h2");
        title_0.textContent =
        `
        Alex-Build Website :
        `
        animated_map_container_content.appendChild(title_0);

        const content_0 = document.createElement("p");
        content_0.textContent =
        `
        The animations on the website are generated and calculated in real time directly by the web browser. In technical terms, the animations are created 
        using elements from the DOM, a dictionary and RAF. In other words, no GIF, MP4 or other pre-recorded animation format is used.
        About the site, this website reflects an inspiration drawn from the visual universe of artist Alphonse de Mucha. 
        The visuals were created mainly using Inkscape.
        `
        animated_map_container_content.appendChild(content_0);

        const image_0 = document.createElement("img");
        image_0.src = "./Assets/Page Logo.png";
        image_0.alt = "Image showing the logo of the website.";
        animated_map_container_content.appendChild(image_0);

        const title_1 = document.createElement("h2");
        title_1.textContent =
        `
        NetCDFViewer Software :
        `
        animated_map_container_content.appendChild(title_1);

        const content_1 = document.createElement("p");
        content_1.textContent =
        `
        I had the opportunity to take part in the GENIFAIR project at the Laboratoire d'Océanologie et de Géosciences (LOG) in Wimereux. 
        I was able to reinforce my knowledge of man-machine interfacing by implementing a UI enabling scientists to acquire in-situ observation 
        data more easily. I also realized a user manual. This project, in the form of a 16-week internship, also enabled me to clearly explain a scientific approach, 
        during several seminars organized with scientists from the ODATIS pole. I have also been able to improve my knowledge of multidimensional data, notably by 
        using libraries such as netCDF4 for data FAIRization applied to PyQt6.

        It is financed by the SFR Campus de la mer, a Federative Research Structure whose main objective is to coordinate research activities in 
        the marine and coastal field in the Hauts-de-France region.
        `
        animated_map_container_content.appendChild(content_1);

        const image_1 = document.createElement("img");
        image_1.src = "./Images/netCDFviewer.png";
        image_1.alt = "Image showing the main interface of the software called netCDFViewer.";
        animated_map_container_content.appendChild(image_1);

        const button_1_1 = document.createElement("button");
        button_1_1.textContent = "See Image"
        button_1_1.style.position = 'relative';
        button_1_1.style.display = 'flex';
        button_1_1.style.flexDirection = 'row';
        button_1_1.style.justifyContent = 'center';
        button_1_1.style.alignItems = 'center';
        button_1_1.style.margin = '0 auto';
        button_1_1.style.width = 'max-content';
        button_1_1.style.padding = '1rem';
        button_1_1.style.backgroundColor = 'transparent';
        button_1_1.style.border = '1px solid #4e4640';
        button_1_1.style.cursor = 'pointer';
        button_1_1.style.color = '#4e4640';
        button_1_1.style.zIndex = '2';
        button_1_1.onclick = function () {window.open(image_1.src, '_blank');};
        animated_map_container_content.insertBefore(button_1_1, image_1.nextSibling);

        const button_1_2 = document.createElement("button");
        button_1_2.textContent = "See On Github"
        button_1_2.style.position = 'relative';
        button_1_2.style.display = 'flex';
        button_1_2.style.flexDirection = 'row';
        button_1_2.style.justifyContent = 'center';
        button_1_2.style.alignItems = 'center';
        button_1_2.style.margin = '0 auto';
        button_1_2.style.width = 'max-content';
        button_1_2.style.padding = '1rem';
        button_1_2.style.backgroundColor = 'transparent';
        button_1_2.style.border = '1px solid #4e4640';
        button_1_2.style.cursor = 'pointer';
        button_1_2.style.color = '#4e4640';
        button_1_2.style.zIndex = '2';
        button_1_2.onclick = function () {window.open('https://github.com/Xavier-LOG/log_genifair_project', '_blank');};
        animated_map_container_content.insertBefore(button_1_2, button_1_1.nextSibling);

        const title_2 = document.createElement("h2");
        title_2.textContent =
        `
        Panier Sympa Promotional Website :
        `
        animated_map_container_content.appendChild(title_2);

        const content_2 = document.createElement("p");
        content_2.textContent =
        `
        I designed the promotional website for the company EIRL Panier Sympa, in Uxem. In the form of a 8-week internship I had the opportunity to
        I developed skills in UX/UI design through the creation of a promotional website using technologies such as HTML, CSS, and JavaScript. 
        I also gained experience in web hosting and SEO by managing the company’s website via platforms like Hostinger, Google My Business, and Meta.
        `
        animated_map_container_content.appendChild(content_2);

        const image_2 = document.createElement("img");
        image_2.src = "./Images/PanierSympa.png";
        image_2.alt = "Image showing the homepage of the promotional website of the company EIRL Panier Sympa.";
        animated_map_container_content.appendChild(image_2);

        const button_2_1 = document.createElement("button");
        button_2_1.textContent = "See Image"
        button_2_1.style.position = 'relative';
        button_2_1.style.display = 'flex';
        button_2_1.style.flexDirection = 'row';
        button_2_1.style.justifyContent = 'center';
        button_2_1.style.alignItems = 'center';
        button_2_1.style.margin = '0 auto';
        button_2_1.style.width = 'max-content';
        button_2_1.style.padding = '1rem';
        button_2_1.style.backgroundColor = 'transparent';
        button_2_1.style.border = '1px solid #4e4640';
        button_2_1.style.cursor = 'pointer';
        button_2_1.style.color = '#4e4640';
        button_2_1.style.zIndex = '2';
        button_2_1.onclick = function () {window.open(image_2.src, '_blank');};
        animated_map_container_content.insertBefore(button_2_1, image_2.nextSibling);

        const button_2_2 = document.createElement("button");
        button_2_2.textContent = "See Website"
        button_2_2.style.position = 'relative';
        button_2_2.style.display = 'flex';
        button_2_2.style.flexDirection = 'row';
        button_2_2.style.justifyContent = 'center';
        button_2_2.style.alignItems = 'center';
        button_2_2.style.margin = '0 auto';
        button_2_2.style.width = 'max-content';
        button_2_2.style.padding = '1rem';
        button_2_2.style.backgroundColor = 'transparent';
        button_2_2.style.border = '1px solid #4e4640';
        button_2_2.style.cursor = 'pointer';
        button_2_2.style.color = '#4e4640';
        button_2_2.style.zIndex = '2';
        button_2_2.onclick = function () {window.open('https://uxempaniersympa.000webhostapp.com/', '_blank');};
        animated_map_container_content.insertBefore(button_2_2, button_2_1.nextSibling);

        const title_3 = document.createElement("h2");
        title_3.textContent =
        `
        FitStacker Software :
        `
        animated_map_container_content.appendChild(title_3);

        const content_3 = document.createElement("p");
        content_3.textContent =
        `
        I programmed in Python a software called 'FitStacker' which is using the stacking method to stack FITS images to obtain high-quality images. 
        This project was developed using PyQt6, astropy and numpy.
        `
        animated_map_container_content.appendChild(content_3);

        const image_3 = document.createElement("img");
        image_3.src = "./Images/FitStacker.jpg";
        image_3.alt = "Image showing the user interface of the software called FitStacker.";
        animated_map_container_content.appendChild(image_3);

        const button_3_1 = document.createElement("button");
        button_3_1.textContent = "See Image"
        button_3_1.style.position = 'relative';
        button_3_1.style.display = 'flex';
        button_3_1.style.flexDirection = 'row';
        button_3_1.style.justifyContent = 'center';
        button_3_1.style.alignItems = 'center';
        button_3_1.style.margin = '0 auto';
        button_3_1.style.width = 'max-content';
        button_3_1.style.padding = '1rem';
        button_3_1.style.backgroundColor = 'transparent';
        button_3_1.style.border = '1px solid #4e4640';
        button_3_1.style.cursor = 'pointer';
        button_3_1.style.color = '#4e4640';
        button_3_1.style.zIndex = '2';
        button_3_1.onclick = function () {window.open(image_3.src, '_blank');};
        animated_map_container_content.insertBefore(button_3_1, image_3.nextSibling);

        const button_3_2 = document.createElement("button");
        button_3_2.textContent = "See On Github"
        button_3_2.style.position = 'relative';
        button_3_2.style.display = 'flex';
        button_3_2.style.flexDirection = 'row';
        button_3_2.style.justifyContent = 'center';
        button_3_2.style.alignItems = 'center';
        button_3_2.style.margin = '0 auto';
        button_3_2.style.width = 'max-content';
        button_3_2.style.padding = '1rem';
        button_3_2.style.backgroundColor = 'transparent';
        button_3_2.style.border = '1px solid #4e4640';
        button_3_2.style.cursor = 'pointer';
        button_3_2.style.color = '#4e4640';
        button_3_2.style.zIndex = '2';
        button_3_2.onclick = function () {window.open('https://github.com/apapinfo/Projects', '_blank');};
        animated_map_container_content.insertBefore(button_3_2, button_3_1.nextSibling);

        const title_4 = document.createElement("h2");
        title_4.textContent =
        `
        'Labyrinthe' Video Game :
        `
        animated_map_container_content.appendChild(title_4);

        const content_4 = document.createElement("p");
        content_4.textContent =
        `
        During my university course, I developed a video game called 'Labyrinthe', as part of a team (GitHub). I used Java and the framework JavaFX. 
        It is directly inspired by the famous board game 'Labyrinthe'.
        `
        animated_map_container_content.appendChild(content_4);

        const title_5 = document.createElement("h2");
        title_5.textContent =
        `
        Bedlam Engine :
        `
        animated_map_container_content.appendChild(title_5);

        const content_5 = document.createElement("p");
        content_5.textContent =
        `
        The "Bedlam Engine" is my heart project. The aim is to be able to spatially visualise multivariate functions in N dimensions. 
        The project is currently under development.
        `
        animated_map_container_content.appendChild(content_5);


        animated_map_container.appendChild(animated_map_container_content);


        document.getElementById("animated-map-container-content-back-button").addEventListener("click", go_back);
    }
};

const open_main_techs = () => {

    const animated_map_container = document.getElementById("animated-map-container");

    if (animated_map_container) {

        localStorage.setItem("animated-map-container-scrolling-level", animated_map_container.scrollTop);

        for (let i = animated_map_container.children.length - 1 ; i >= 0 ; --i) {

            animated_map_container.removeChild(animated_map_container.children[i]);
        }

        const animated_map_container_content = document.createElement("div");
        animated_map_container_content.classList.add("animated-map-container-content");

        const animated_map_container_content_back_button = document.createElement("button");
        animated_map_container_content_back_button.id = "animated-map-container-content-back-button";
        animated_map_container_content.appendChild(animated_map_container_content_back_button);

        const title_1 = document.createElement("h2");
        title_1.textContent =
        `
        My Main Technologies :
        `
        animated_map_container_content.appendChild(title_1);

        const content_1 = document.createElement("p");
        content_1.textContent =
        `
        I'm comfortable with several programming languages, mainly Python, followed by JavaScript (with the React Framework for the front-end, and the Express JS 
        framework for the back-end), then C++. You can find out more about the use of these technologies in the 'Projects' section.
        `
        animated_map_container_content.appendChild(content_1);

        const image_1 = document.createElement("img");
        image_1.src = "./Assets/Python JS.png";
        image_1.alt = "Image showing a Python inspired logo and a JavaScript inspired logo.";
        animated_map_container_content.appendChild(image_1);

        const image_2 = document.createElement("img");
        image_2.src = "./Assets/Cpp.png";
        image_2.alt = "Image showing a C++ inspired logo.";
        animated_map_container_content.appendChild(image_2);


        animated_map_container.appendChild(animated_map_container_content);


        document.getElementById("animated-map-container-content-back-button").addEventListener("click", go_back);
    }
};

const open_contact = () => {

    const animated_map_container = document.getElementById("animated-map-container");

    if (animated_map_container) {

        localStorage.setItem("animated-map-container-scrolling-level", animated_map_container.scrollTop);

        for (let i = animated_map_container.children.length - 1 ; i >= 0 ; --i) {

            animated_map_container.removeChild(animated_map_container.children[i]);
        }

        const animated_map_container_content = document.createElement("div");
        animated_map_container_content.classList.add("animated-map-container-content");

        const animated_map_container_content_back_button = document.createElement("button");
        animated_map_container_content_back_button.id = "animated-map-container-content-back-button";
        animated_map_container_content.appendChild(animated_map_container_content_back_button);

        const title_1 = document.createElement("h2");
        title_1.textContent =
        `
        Contact :
        `
        animated_map_container_content.appendChild(title_1);

        const button_1_1 = document.createElement("button");
        button_1_1.textContent = "My GitHub Page"
        button_1_1.style.position = 'relative';
        button_1_1.style.display = 'flex';
        button_1_1.style.flexDirection = 'row';
        button_1_1.style.justifyContent = 'center';
        button_1_1.style.alignItems = 'center';
        button_1_1.style.margin = '0 auto';
        button_1_1.style.width = 'max-content';
        button_1_1.style.padding = '1rem';
        button_1_1.style.backgroundColor = 'transparent';
        button_1_1.style.border = '1px solid #4e4640';
        button_1_1.style.cursor = 'pointer';
        button_1_1.style.color = '#4e4640';
        button_1_1.style.zIndex = '2';
        button_1_1.onclick = function () {window.open('https://github.com/apapinfo', '_blank');};
        animated_map_container_content.insertBefore(button_1_1, title_1.nextSibling);

        const content_1 = document.createElement("p");
        content_1.textContent =
        `
        For any request concerning my projects, proposals or suggestions, please contact me : apapfrance@gmail.com
        `
        animated_map_container_content.appendChild(content_1);


        animated_map_container.appendChild(animated_map_container_content);


        document.getElementById("animated-map-container-content-back-button").addEventListener("click", go_back);
    }
};

const open_about_me = () => {

    const animated_map_container = document.getElementById("animated-map-container");

    if (animated_map_container) {

        localStorage.setItem("animated-map-container-scrolling-level", animated_map_container.scrollTop);

        for (let i = animated_map_container.children.length - 1 ; i >= 0 ; --i) {

            animated_map_container.removeChild(animated_map_container.children[i]);
        }

        const animated_map_container_content = document.createElement("div");
        animated_map_container_content.classList.add("animated-map-container-content");

        const animated_map_container_content_back_button = document.createElement("button");
        animated_map_container_content_back_button.id = "animated-map-container-content-back-button";
        animated_map_container_content.appendChild(animated_map_container_content_back_button);

        const title_1 = document.createElement("h2");
        title_1.textContent =
        `
        About me :
        `
        animated_map_container_content.appendChild(title_1);

        const content_1 = document.createElement("p");
        content_1.textContent =
        `
        I did a first year of preparatory classes at HEI (Haute Ecole d'Ingénieur) in the North of France (Lille).
        I then studied computer science and specialized in software development in the North of France, at the Institut Universitaire et Technologique du Littoral 
        Côte D'Opale, where I obtained a Computer Science degree.
        I also took additional training in game design and Unity development.
        I'm passionate about new digital and IT technologies, so I can create projects that reflect my personality.
        My Heart Project is called the "Bedlam Engine" and aims to be a multidimensional spatial graphed program. This project is currently under development.
        This project is a more personal reflection of my vision of multidimensionality.
        `
        animated_map_container_content.appendChild(content_1);


        animated_map_container.appendChild(animated_map_container_content);


        document.getElementById("animated-map-container-content-back-button").addEventListener("click", go_back);
    }
};

const restore_scrolling_level = (animated_map_container) => {

    if (animated_map_container) {

        const animated_map_container_scrolling_level = localStorage.getItem("animated-map-container-scrolling-level");
        
        if (animated_map_container_scrolling_level !== null) {

            animated_map_container.scrollTop = parseInt(animated_map_container_scrolling_level, 10);
        }
    }

};

const go_back = () => {

    const animated_map_container = document.getElementById("animated-map-container");

    if (animated_map_container) {

        for (let i = animated_map_container.children.length - 1 ; i >= 0 ; --i) {

            animated_map_container.removeChild(animated_map_container.children[i]);
        }

        const projects = document.createElement("button");
        projects.id = "projects";
        projects.classList.add("animated-map-container-button");
        animated_map_container.appendChild(projects);

        const main_techs = document.createElement("button");
        main_techs.id = "main-techs";
        main_techs.classList.add("animated-map-container-button");
        animated_map_container.appendChild(main_techs);

        const contact = document.createElement("button");
        contact.id = "contact";
        contact.classList.add("animated-map-container-button");
        animated_map_container.appendChild(contact);

        const about_me = document.createElement("button");
        about_me.id = "about-me";
        about_me.classList.add("animated-map-container-button");
        animated_map_container.appendChild(about_me);

        restore_scrolling_level(animated_map_container);

        document.getElementById("projects").addEventListener("click", open_projects);
        document.getElementById("main-techs").addEventListener("click", open_main_techs);
        document.getElementById("contact").addEventListener("click", open_contact);
        document.getElementById("about-me").addEventListener("click", open_about_me);
    }
}

document.getElementById("projects").addEventListener("click", open_projects);
document.getElementById("main-techs").addEventListener("click", open_main_techs);
document.getElementById("contact").addEventListener("click", open_contact);
document.getElementById("about-me").addEventListener("click", open_about_me);

window.addEventListener('wheel', function(e) {

    if (e.ctrlKey) {

      e.preventDefault();
    }
    
}, { passive: false });

window.addEventListener('keydown', function(e) {

    if (e.ctrlKey && (e.key === '+' || e.key === '-' || e.key === '=')) {

        e.preventDefault();
    }

});




animate(container, svg, animation_page_list, index_state, raf_ids_list_state);
