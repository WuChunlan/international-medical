package com.intlmedical.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.intlmedical.entity.Doctor;
import com.intlmedical.entity.EntityMedia;
import com.intlmedical.entity.Equipment;
import com.intlmedical.entity.Hospital;
import com.intlmedical.entity.HospitalEnvironment;
import com.intlmedical.mapper.DoctorMapper;
import com.intlmedical.mapper.EntityMediaMapper;
import com.intlmedical.mapper.EquipmentMapper;
import com.intlmedical.mapper.HospitalMapper;
import com.intlmedical.mapper.HospitalEnvironmentMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HospitalService {

    private final HospitalMapper hospitalMapper;
    private final DoctorMapper doctorMapper;
    private final EquipmentMapper equipmentMapper;
    private final EntityMediaMapper entityMediaMapper;
    private final HospitalEnvironmentMapper hospitalEnvironmentMapper;
    private final ContentTranslationService translationService;

    private static final List<String> BUILTIN_LANGS = List.of("zh", "en");

    public List<Hospital> listActive() {
        return listActive("zh");
    }

    public List<Hospital> listActive(String lang) {
        List<Hospital> list = hospitalMapper.selectList(
            new LambdaQueryWrapper<Hospital>()
                .eq(Hospital::getIsActive, 1)
                .eq(Hospital::getAuditStatus, "approved")
                .orderByAsc(Hospital::getSortOrder)
        );
        if (!BUILTIN_LANGS.contains(lang)) {
            list.forEach(h -> h.setTranslations(
                translationService.getAll("hospital", h.getId(), lang)
            ));
        }
        return list;
    }

    public Map<String, Object> getDetail(Long id) {
        return getDetail(id, "zh");
    }

    public Map<String, Object> getDetail(Long id, String lang) {
        Hospital hospital = hospitalMapper.selectById(id);
        if (hospital != null && !BUILTIN_LANGS.contains(lang)) {
            hospital.setTranslations(translationService.getAll("hospital", id, lang));
        }
        List<Doctor> doctors = doctorMapper.selectList(
            new LambdaQueryWrapper<Doctor>()
                .eq(Doctor::getHospitalId, id)
                .eq(Doctor::getIsActive, 1)
                .eq(Doctor::getAuditStatus, "approved")
                .orderByAsc(Doctor::getSortOrder)
        );
        List<Equipment> equipments = equipmentMapper.selectList(
            new LambdaQueryWrapper<Equipment>()
                .eq(Equipment::getHospitalId, id)
                .eq(Equipment::getIsActive, 1)
                .eq(Equipment::getAuditStatus, "approved")
                .orderByAsc(Equipment::getSortOrder)
        );
        List<HospitalEnvironment> environments = hospitalEnvironmentMapper.selectList(
            new LambdaQueryWrapper<HospitalEnvironment>()
                .eq(HospitalEnvironment::getHospitalId, id)
                .eq(HospitalEnvironment::getIsActive, 1)
                .eq(HospitalEnvironment::getAuditStatus, "approved")
                .orderByAsc(HospitalEnvironment::getSortOrder)
        );
        if (!BUILTIN_LANGS.contains(lang)) {
            doctors.forEach(d -> d.setTranslations(translationService.getAll("doctor", d.getId(), lang)));
            equipments.forEach(e -> e.setTranslations(translationService.getAll("equipment", e.getId(), lang)));
            environments.forEach(e -> e.setTranslations(translationService.getAll("environment", e.getId(), lang)));
        }

        List<EntityMedia> mediaList = entityMediaMapper.selectList(
            new LambdaQueryWrapper<EntityMedia>()
                .eq(EntityMedia::getEntityType, "hospital")
                .eq(EntityMedia::getEntityId, id)
                .orderByAsc(EntityMedia::getSortOrder)
        );

        // Doctor media keyed by doctorId
        List<Long> doctorIds = doctors.stream().map(Doctor::getId).collect(Collectors.toList());
        Map<Long, List<EntityMedia>> doctorMediaMap = new HashMap<>();
        if (!doctorIds.isEmpty()) {
            List<EntityMedia> doctorMedia = entityMediaMapper.selectList(
                new LambdaQueryWrapper<EntityMedia>()
                    .eq(EntityMedia::getEntityType, "doctor")
                    .in(EntityMedia::getEntityId, doctorIds)
                    .orderByAsc(EntityMedia::getSortOrder)
            );
            doctorMediaMap = doctorMedia.stream()
                .collect(Collectors.groupingBy(EntityMedia::getEntityId));
        }

        Map<String, Object> result = new HashMap<>();
        result.put("hospital", hospital);
        result.put("doctors", doctors);
        result.put("equipments", equipments);
        result.put("environments", environments);
        result.put("mediaList", mediaList);
        result.put("doctorMediaMap", doctorMediaMap);
        return result;
    }
}
