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
import java.util.List;

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

    public void submitNewDraft(String entityType, Object entityData,
                               Long submittedBy) throws JsonProcessingException {
        String json = objectMapper.writeValueAsString(entityData);
        PendingChange pc = new PendingChange();
        pc.setEntityType(entityType);
        pc.setEntityId(null);
        pc.setPendingData(json);
        pc.setSubmittedBy(submittedBy);
        pc.setAuditStatus("pending");
        pendingChangeMapper.insert(pc);
    }

    // For hospital create: entity already inserted (to get ID), but needs a pending_changes record
    public void submitNewDraftWithEntityId(String entityType, Object entityData,
                                           Long entityId, Long submittedBy) throws JsonProcessingException {
        String json = objectMapper.writeValueAsString(entityData);
        PendingChange pc = new PendingChange();
        pc.setEntityType(entityType);
        pc.setEntityId(entityId);
        pc.setPendingData(json);
        pc.setSubmittedBy(submittedBy);
        pc.setAuditStatus("pending");
        pendingChangeMapper.insert(pc);
    }

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

    /**
     * Submit a media-only change for an already-existing approved entity.
     * Reads the current entity fields and current media list, applies the
     * requested media operation in memory, then upserts a pending_changes record
     * so the change is reviewed before being written to the live tables.
     *
     * @param action   "add", "set-cover", or "delete"
     * @param newMedia the EntityMedia item being added or operated on (null for "delete")
     * @param targetId the entity_media.id for "set-cover" and "delete" operations
     */
    public void submitMediaEdit(String entityType, Long entityId,
                                String action, EntityMedia newMedia, Long targetId,
                                Long submittedBy) throws JsonProcessingException {
        // 1. Read current live entity as a JSON node (base for pending_data)
        Object liveEntity = readLiveEntity(entityType, entityId);
        com.fasterxml.jackson.databind.node.ObjectNode pendingNode =
            objectMapper.valueToTree(liveEntity);

        // 2. Build updated media list in memory
        String singularType = toSingular(entityType);
        List<EntityMedia> currentMedia = entityMediaMapper.selectList(
            new LambdaQueryWrapper<EntityMedia>()
                .eq(EntityMedia::getEntityType, singularType)
                .eq(EntityMedia::getEntityId, entityId)
                .orderByAsc(EntityMedia::getSortOrder));

        java.util.ArrayList<EntityMedia> updatedMedia = new java.util.ArrayList<>(currentMedia);

        switch (action) {
            case "add" -> {
                boolean isFirst = updatedMedia.isEmpty();
                if (newMedia != null) {
                    newMedia.setIsCover(isFirst && !"video".equals(newMedia.getMediaType()) ? 1 : 0);
                    updatedMedia.add(newMedia);
                }
            }
            case "set-cover" -> updatedMedia.forEach(m -> {
                if ("video".equals(m.getMediaType())) return;
                m.setIsCover(m.getId() != null && m.getId().equals(targetId) ? 1 : 0);
            });
            case "delete" -> updatedMedia.removeIf(m -> m.getId() != null && m.getId().equals(targetId));
        }

        // 3. Embed updated media array into the pending node
        pendingNode.set("media", objectMapper.valueToTree(updatedMedia));

        // 4. If there is an existing pending change, preserve its entity-field edits
        //    but replace the media array with our updated one.
        PendingChange pc = pendingChangeMapper.selectByEntity(entityType, entityId);
        if (pc != null && "pending".equals(pc.getAuditStatus())) {
            com.fasterxml.jackson.databind.node.ObjectNode existingNode =
                (com.fasterxml.jackson.databind.node.ObjectNode) objectMapper.readTree(pc.getPendingData());
            existingNode.set("media", pendingNode.get("media"));
            pc.setPendingData(objectMapper.writeValueAsString(existingNode));
        } else {
            if (pc == null) {
                pc = new PendingChange();
                pc.setEntityType(entityType);
                pc.setEntityId(entityId);
            }
            pc.setPendingData(objectMapper.writeValueAsString(pendingNode));
        }
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

    Object readLiveEntity(String entityType, Long entityId) {
        return switch (entityType) {
            case "hospitals"    -> hospitalMapper.selectById(entityId);
            case "doctors"      -> doctorMapper.selectById(entityId);
            case "equipments"   -> equipmentMapper.selectById(entityId);
            case "environments" -> environmentMapper.selectById(entityId);
            case "cases"        -> caseMapper.selectById(entityId);
            case "products"     -> productMapper.selectById(entityId);
            default -> throw new IllegalArgumentException("Unknown entity type: " + entityType);
        };
    }

    public Object readLiveEntityPublic(String entityType, Long entityId) {
        return readLiveEntity(entityType, entityId);
    }

    @Transactional
    public void applyApproval(String entityType, Long entityId,
                              PendingChange pc, Long reviewerId) throws JsonProcessingException {
        JsonNode data = objectMapper.readTree(pc.getPendingData());
        if (entityId == null) {
            // New-record draft: INSERT into the main table
            entityId = insertNewEntity(entityType, data);
            pc.setEntityId(entityId);
        } else {
            switch (entityType) {
                case "hospitals"    -> applyHospital(entityId, data);
                case "doctors"      -> applyDoctor(entityId, data);
                case "equipments"   -> applyEquipment(entityId, data);
                case "environments" -> applyEnvironment(entityId, data);
                case "cases"        -> applyCase(entityId, data);
                case "products"     -> applyProduct(entityId, data);
                default             -> throw new IllegalArgumentException("Unknown entity type: " + entityType);
            }
            setLiveAuditStatus(entityType, entityId, "approved", null);
        }
        applyMedia(entityType, entityId, data);
        pc.setAuditStatus("approved");
        pc.setReviewedAt(LocalDateTime.now());
        pc.setReviewedBy(reviewerId);
        pendingChangeMapper.updateById(pc);
    }

    private Long insertNewEntity(String entityType, JsonNode d) {
        return switch (entityType) {
            case "doctors" -> {
                Doctor dr = new Doctor();
                dr.setHospitalId(d.path("hospitalId").asLong());
                dr.setNameZh(d.path("nameZh").asText(""));
                dr.setNameEn(d.path("nameEn").asText(""));
                dr.setSpecialtyZh(textOrNull(d, "specialtyZh"));
                dr.setSpecialtyEn(textOrNull(d, "specialtyEn"));
                dr.setBioZh(textOrNull(d, "bioZh"));
                dr.setBioEn(textOrNull(d, "bioEn"));
                dr.setPhotoUrl(textOrNull(d, "photoUrl"));
                dr.setPricePerVisit(decimalOrNull(d, "pricePerVisit"));
                dr.setTitleZh(textOrNull(d, "titleZh"));
                dr.setTitleEn(textOrNull(d, "titleEn"));
                dr.setSortOrder(d.path("sortOrder").asInt(0));
                dr.setIsActive(1);
                dr.setAuditStatus("approved");
                doctorMapper.insert(dr);
                yield dr.getId();
            }
            case "equipments" -> {
                Equipment eq = new Equipment();
                eq.setHospitalId(d.path("hospitalId").asLong());
                eq.setNameZh(d.path("nameZh").asText(""));
                eq.setNameEn(d.path("nameEn").asText(""));
                eq.setDescZh(textOrNull(d, "descZh"));
                eq.setDescEn(textOrNull(d, "descEn"));
                eq.setImageUrl(textOrNull(d, "imageUrl"));
                eq.setSortOrder(d.path("sortOrder").asInt(0));
                eq.setIsActive(1);
                eq.setAuditStatus("approved");
                equipmentMapper.insert(eq);
                yield eq.getId();
            }
            case "environments" -> {
                HospitalEnvironment env = new HospitalEnvironment();
                env.setHospitalId(d.path("hospitalId").asLong());
                env.setNameZh(d.path("nameZh").asText(""));
                env.setNameEn(d.path("nameEn").asText(""));
                env.setDescZh(textOrNull(d, "descZh"));
                env.setDescEn(textOrNull(d, "descEn"));
                env.setImageUrl(textOrNull(d, "imageUrl"));
                env.setSortOrder(d.path("sortOrder").asInt(0));
                env.setIsActive(1);
                env.setAuditStatus("approved");
                environmentMapper.insert(env);
                yield env.getId();
            }
            case "cases" -> {
                Case c = new Case();
                c.setHospitalId(d.path("hospitalId").asLong());
                c.setTitleZh(d.path("titleZh").asText(""));
                c.setTitleEn(d.path("titleEn").asText(""));
                c.setSummaryZh(textOrNull(d, "summaryZh"));
                c.setSummaryEn(textOrNull(d, "summaryEn"));
                c.setDetailZh(textOrNull(d, "detailZh"));
                c.setDetailEn(textOrNull(d, "detailEn"));
                c.setCoverImageUrl(textOrNull(d, "coverImageUrl"));
                c.setSortOrder(d.path("sortOrder").asInt(0));
                c.setIsActive(1);
                c.setAuditStatus("approved");
                caseMapper.insert(c);
                yield c.getId();
            }
            case "products" -> {
                SpecialProduct p = new SpecialProduct();
                p.setHospitalId(d.path("hospitalId").asLong());
                p.setNameZh(d.path("nameZh").asText(""));
                p.setNameEn(d.path("nameEn").asText(""));
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
                p.setIsActive(1);
                p.setAuditStatus("approved");
                productMapper.insert(p);
                yield p.getId();
            }
            default -> throw new IllegalArgumentException("New-draft INSERT not supported for: " + entityType);
        };
    }

    public void applyRejection(PendingChange pc, String reason, Long reviewerId) {
        pc.setAuditStatus("rejected");
        pc.setRejectionReason(reason);
        pc.setReviewedAt(LocalDateTime.now());
        pc.setReviewedBy(reviewerId);
        pendingChangeMapper.updateById(pc);
        // For a new hospital creation (entity exists in hospitals table with pending status),
        // propagate the rejection so the HA can see the reason and resubmit.
        if ("hospitals".equals(pc.getEntityType()) && pc.getEntityId() != null) {
            Hospital h = hospitalMapper.selectById(pc.getEntityId());
            if (h != null && "pending".equals(h.getAuditStatus())) {
                hospitalMapper.update(null, new LambdaUpdateWrapper<Hospital>()
                    .eq(Hospital::getId, pc.getEntityId())
                    .set(Hospital::getAuditStatus, "rejected")
                    .set(Hospital::getRejectionReason, reason));
            }
        }
    }

    private void applyHospital(Long id, JsonNode d) {
        Hospital h = hospitalMapper.selectById(id);
        if (h == null) throw new IllegalStateException("Entity not found: hospitals/" + id);
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
        if (dr == null) throw new IllegalStateException("Entity not found: doctors/" + id);
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
        if (eq == null) throw new IllegalStateException("Entity not found: equipments/" + id);
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
        if (env == null) throw new IllegalStateException("Entity not found: environments/" + id);
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
        if (c == null) throw new IllegalStateException("Entity not found: cases/" + id);
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
        if (p == null) throw new IllegalStateException("Entity not found: products/" + id);
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
        String singularType = toSingular(entityType);
        entityMediaMapper.delete(new LambdaQueryWrapper<EntityMedia>()
            .eq(EntityMedia::getEntityType, singularType)
            .eq(EntityMedia::getEntityId, entityId));
        for (JsonNode m : mediaNode) {
            EntityMedia em = new EntityMedia();
            em.setEntityType(singularType);
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
            default -> throw new IllegalArgumentException("Unknown entity type: " + entityType);
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

    private String toSingular(String plural) {
        return switch (plural) {
            case "hospitals"    -> "hospital";
            case "doctors"      -> "doctor";
            case "equipments"   -> "equipment";
            case "environments" -> "environment";
            case "cases"        -> "case";
            case "products"     -> "product";
            default             -> plural;
        };
    }
}
