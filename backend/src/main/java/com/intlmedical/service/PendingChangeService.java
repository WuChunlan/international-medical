package com.intlmedical.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.intlmedical.entity.*;
import com.intlmedical.mapper.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class PendingChangeService {

    private final PendingChangeMapper pendingChangeMapper;
    private final HospitalMapper hospitalMapper;
    private final DoctorMapper doctorMapper;
    private final EquipmentMapper equipmentMapper;
    private final HospitalEnvironmentMapper environmentMapper;
    private final CaseMapper caseMapper;
    private final SpecialProductMapper productMapper;
    private final EntityMediaMapper entityMediaMapper;
    private final ProductVariantMapper variantMapper;
    private final ObjectMapper objectMapper;

    public void submitEdit(String entityType, Long entityId,
                           Object entityData, Long submittedBy) throws JsonProcessingException {
        String json = objectMapper.writeValueAsString(entityData);
        PendingChange pc = pendingChangeMapper.selectByEntity(entityType, entityId);
        if (pc == null) {
            pc = new PendingChange();
            pc.setEntityType(entityType);
            pc.setEntityId(entityId);
        }
        pc.setPendingData(json);
        pc.setSubmittedBy(submittedBy);
        pc.setAuditStatus("pending");
        pc.setRejectionReason(null);
        pc.setReviewedAt(null);
        pc.setReviewedBy(null);
        if (pc.getId() == null) {
            pendingChangeMapper.insert(pc);
        } else {
            pendingChangeMapper.updateById(pc);
        }
    }

    @Transactional
    public void applyApproval(String entityType, Long entityId,
                              PendingChange pc, Long reviewerId) throws JsonProcessingException {
        JsonNode data = objectMapper.readTree(pc.getPendingData());
        switch (entityType) {
            case "hospitals"    -> applyHospital(entityId, data);
            case "doctors"      -> applyDoctor(entityId, data);
            case "equipments"   -> applyEquipment(entityId, data);
            case "environments" -> applyEnvironment(entityId, data);
            case "cases"        -> applyCase(entityId, data);
            case "products"     -> applyProduct(entityId, data);
        }
        setLiveAuditStatus(entityType, entityId, "approved", null);
        applyMedia(entityType, entityId, data);
        pendingChangeMapper.deleteById(pc.getId());
    }

    public void applyRejection(PendingChange pc, String reason, Long reviewerId) {
        pc.setAuditStatus("rejected");
        pc.setRejectionReason(reason);
        pc.setReviewedAt(LocalDateTime.now());
        pc.setReviewedBy(reviewerId);
        pendingChangeMapper.updateById(pc);
    }

    private void applyHospital(Long id, JsonNode d) {
        Hospital h = hospitalMapper.selectById(id);
        h.setNameZh(d.path("nameZh").asText(h.getNameZh()));
        h.setNameEn(d.path("nameEn").asText(h.getNameEn()));
        h.setIntroZh(textOrNull(d, "introZh"));
        h.setIntroEn(textOrNull(d, "introEn"));
        h.setCoverImageUrl(textOrNull(d, "coverImageUrl"));
        h.setAddressZh(textOrNull(d, "addressZh"));
        h.setAddressEn(textOrNull(d, "addressEn"));
        h.setPhone(textOrNull(d, "phone"));
        h.setContactPerson(textOrNull(d, "contactPerson"));
        h.setContactInfo(textOrNull(d, "contactInfo"));
        h.setSortOrder(d.path("sortOrder").asInt(0));
        hospitalMapper.updateById(h);
    }

    private void applyDoctor(Long id, JsonNode d) {
        Doctor dr = doctorMapper.selectById(id);
        dr.setNameZh(d.path("nameZh").asText(dr.getNameZh()));
        dr.setNameEn(d.path("nameEn").asText(dr.getNameEn()));
        dr.setSpecialtyZh(textOrNull(d, "specialtyZh"));
        dr.setSpecialtyEn(textOrNull(d, "specialtyEn"));
        dr.setBioZh(textOrNull(d, "bioZh"));
        dr.setBioEn(textOrNull(d, "bioEn"));
        dr.setPhotoUrl(textOrNull(d, "photoUrl"));
        dr.setPricePerVisit(decimalOrNull(d, "pricePerVisit"));
        dr.setTitleZh(textOrNull(d, "titleZh"));
        dr.setTitleEn(textOrNull(d, "titleEn"));
        dr.setSortOrder(d.path("sortOrder").asInt(0));
        doctorMapper.updateById(dr);
    }

    private void applyEquipment(Long id, JsonNode d) {
        Equipment eq = equipmentMapper.selectById(id);
        eq.setNameZh(d.path("nameZh").asText(eq.getNameZh()));
        eq.setNameEn(d.path("nameEn").asText(eq.getNameEn()));
        eq.setDescZh(textOrNull(d, "descZh"));
        eq.setDescEn(textOrNull(d, "descEn"));
        eq.setImageUrl(textOrNull(d, "imageUrl"));
        eq.setSortOrder(d.path("sortOrder").asInt(0));
        equipmentMapper.updateById(eq);
    }

    private void applyEnvironment(Long id, JsonNode d) {
        HospitalEnvironment env = environmentMapper.selectById(id);
        env.setNameZh(d.path("nameZh").asText(env.getNameZh()));
        env.setNameEn(d.path("nameEn").asText(env.getNameEn()));
        env.setDescZh(textOrNull(d, "descZh"));
        env.setDescEn(textOrNull(d, "descEn"));
        env.setImageUrl(textOrNull(d, "imageUrl"));
        env.setSortOrder(d.path("sortOrder").asInt(0));
        environmentMapper.updateById(env);
    }

    private void applyCase(Long id, JsonNode d) {
        Case c = caseMapper.selectById(id);
        c.setTitleZh(d.path("titleZh").asText(c.getTitleZh()));
        c.setTitleEn(d.path("titleEn").asText(c.getTitleEn()));
        c.setSummaryZh(textOrNull(d, "summaryZh"));
        c.setSummaryEn(textOrNull(d, "summaryEn"));
        c.setDetailZh(textOrNull(d, "detailZh"));
        c.setDetailEn(textOrNull(d, "detailEn"));
        c.setCoverImageUrl(textOrNull(d, "coverImageUrl"));
        c.setSortOrder(d.path("sortOrder").asInt(0));
        caseMapper.updateById(c);
    }

    private void applyProduct(Long id, JsonNode d) {
        SpecialProduct p = productMapper.selectById(id);
        p.setNameZh(d.path("nameZh").asText(p.getNameZh()));
        p.setNameEn(d.path("nameEn").asText(p.getNameEn()));
        p.setSummaryZh(textOrNull(d, "summaryZh"));
        p.setSummaryEn(textOrNull(d, "summaryEn"));
        p.setDetailZh(textOrNull(d, "detailZh"));
        p.setDetailEn(textOrNull(d, "detailEn"));
        p.setCoverImageUrl(textOrNull(d, "coverImageUrl"));
        p.setPriceMin(decimalOrNull(d, "priceMin"));
        p.setPriceMax(decimalOrNull(d, "priceMax"));
        p.setContactPerson(textOrNull(d, "contactPerson"));
        p.setContactInfo(textOrNull(d, "contactInfo"));
        p.setSortOrder(d.path("sortOrder").asInt(0));
        productMapper.updateById(p);
        variantMapper.delete(new LambdaQueryWrapper<ProductVariant>()
            .eq(ProductVariant::getProductId, id));
        JsonNode variants = d.path("variants");
        if (variants.isArray()) {
            for (JsonNode v : variants) {
                ProductVariant pv = new ProductVariant();
                pv.setProductId(id);
                pv.setNameZh(v.path("nameZh").asText(""));
                pv.setNameEn(v.path("nameEn").asText(""));
                pv.setDescZh(textOrNull(v, "descZh"));
                pv.setDescEn(textOrNull(v, "descEn"));
                pv.setPrice(decimalOrNull(v, "price"));
                pv.setSortOrder(v.path("sortOrder").asInt(0));
                pv.setIsActive(v.path("isActive").asInt(1));
                variantMapper.insert(pv);
            }
        }
    }

    private void applyMedia(String entityType, Long entityId, JsonNode d) {
        JsonNode mediaNode = d.path("media");
        if (!mediaNode.isArray()) return;
        entityMediaMapper.delete(new LambdaQueryWrapper<EntityMedia>()
            .eq(EntityMedia::getEntityType, entityType)
            .eq(EntityMedia::getEntityId, entityId));
        for (JsonNode m : mediaNode) {
            EntityMedia em = new EntityMedia();
            em.setEntityType(entityType);
            em.setEntityId(entityId);
            em.setUrl(m.path("url").asText(""));
            em.setMediaType(m.path("mediaType").asText("image"));
            em.setIsCover(m.path("isCover").asInt(0));
            em.setSortOrder(m.path("sortOrder").asInt(0));
            entityMediaMapper.insert(em);
        }
    }

    private void setLiveAuditStatus(String entityType, Long entityId,
                                     String status, String reason) {
        switch (entityType) {
            case "hospitals" -> hospitalMapper.update(null,
                new LambdaUpdateWrapper<Hospital>()
                    .eq(Hospital::getId, entityId)
                    .set(Hospital::getAuditStatus, status)
                    .set(Hospital::getRejectionReason, reason));
            case "doctors" -> doctorMapper.update(null,
                new LambdaUpdateWrapper<Doctor>()
                    .eq(Doctor::getId, entityId)
                    .set(Doctor::getAuditStatus, status)
                    .set(Doctor::getRejectionReason, reason));
            case "equipments" -> equipmentMapper.update(null,
                new LambdaUpdateWrapper<Equipment>()
                    .eq(Equipment::getId, entityId)
                    .set(Equipment::getAuditStatus, status)
                    .set(Equipment::getRejectionReason, reason));
            case "environments" -> environmentMapper.update(null,
                new LambdaUpdateWrapper<HospitalEnvironment>()
                    .eq(HospitalEnvironment::getId, entityId)
                    .set(HospitalEnvironment::getAuditStatus, status)
                    .set(HospitalEnvironment::getRejectionReason, reason));
            case "cases" -> caseMapper.update(null,
                new LambdaUpdateWrapper<Case>()
                    .eq(Case::getId, entityId)
                    .set(Case::getAuditStatus, status)
                    .set(Case::getRejectionReason, reason));
            case "products" -> productMapper.update(null,
                new LambdaUpdateWrapper<SpecialProduct>()
                    .eq(SpecialProduct::getId, entityId)
                    .set(SpecialProduct::getAuditStatus, status)
                    .set(SpecialProduct::getRejectionReason, reason));
        }
    }

    private String textOrNull(JsonNode node, String field) {
        JsonNode n = node.path(field);
        if (n.isMissingNode() || n.isNull()) return null;
        return n.asText();
    }

    private BigDecimal decimalOrNull(JsonNode node, String field) {
        JsonNode n = node.path(field);
        if (n.isMissingNode() || n.isNull()) return null;
        return new BigDecimal(n.asText("0"));
    }
}
