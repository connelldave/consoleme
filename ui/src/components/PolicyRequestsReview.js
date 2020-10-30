import ReactDOM from "react-dom";

import React, { Component } from "react";
import {
  Button,
  Dimmer,
  Divider,
  Grid,
  Header,
  Icon,
  Image,
  Loader,
  Message,
  Segment,
  Table,
} from "semantic-ui-react";
import CommentsFeedBlockComponent from "./blocks/CommentsFeedBlockComponent";
import InlinePolicyChangeComponent from "./blocks/InlinePolicyChangeComponent";
import ManagedPolicyChangeComponent from "./blocks/ManagedPolicyChangeComponent";
import AssumeRolePolicyChangeComponent from "./blocks/AssumeRolePolicyChangeComponent";
import ResourcePolicyChangeComponent from "./blocks/ResourcePolicyChangeComponent";
import {
  sendProposedPolicy,
  sendRequestCommon,
  updateRequestStatus,
} from "../helpers/utils";

class PolicyRequestReview extends Component {
  constructor(props) {
    super(props);
    this.state = {
      requestID: props.match.params.requestID,
      loading: false,
      extendedRequest: {},
      messages: [],
      isSubmitting: false,
      lastUpdated: null,
      requestConfig: {},
      policyDocuments: {},
    };
    this.reloadDataFromBackend = this.reloadDataFromBackend.bind(this);
    this.updatePolicyDocument = this.updatePolicyDocument.bind(this);
    this.updateRequestStatus = updateRequestStatus.bind(this);
    this.sendProposedPolicy = sendProposedPolicy.bind(this);
  }

  componentDidMount() {
    this.reloadDataFromBackend();
  }

  updatePolicyDocument(changeID, policyDocument) {
    const { policyDocuments } = this.state;
    policyDocuments[changeID] = policyDocument;
    this.setState({
      policyDocuments,
    });
  }

  reloadDataFromBackend() {
    const { requestID } = this.state;
    this.setState(
      {
        loading: true,
      },
      () => {
        sendRequestCommon(null, `/api/v2/requests/${requestID}`, "get").then(
          (response) => {
            if (response.status === 404 || response.status === 500) {
              this.setState({
                loading: false,
                messages: [response.message],
              });
            } else {
              const { request, request_config, last_updated } = response;
              this.setState({
                extendedRequest: JSON.parse(request),
                requestConfig: request_config,
                lastUpdated: last_updated,
                loading: false,
              });
            }
          }
        );
      }
    );
  }

  render() {
    const {
      lastUpdated,
      extendedRequest,
      messages,
      isSubmitting,
      requestConfig,
      loading,
      requestID,
    } = this.state;

    // Checks whether extendedInfo is available for the requester or not, if it is, saves it as a variable
    const extendedInfo =
      extendedRequest.requester_info &&
      extendedRequest.requester_info.extended_info
        ? extendedRequest.requester_info.extended_info
        : null;

    const requesterName =
      extendedInfo && extendedInfo.name && extendedInfo.name.fullName
        ? extendedInfo.name.fullName + " - "
        : null;

    const requesterImage =
      extendedRequest.requester_info &&
      extendedRequest.requester_info.photo_url ? (
        <Image
          src={extendedRequest.requester_info.photo_url}
          size="small"
          inline
        />
      ) : null;

    const requesterEmail =
      extendedRequest.requester_info &&
      extendedRequest.requester_info.details_url ? (
        <a
          href={extendedRequest.requester_info.details_url}
          target="_blank"
          rel="noreferrer"
        >
          {extendedRequest.requester_email}
        </a>
      ) : (
        <span>{extendedRequest.requester_email}</span>
      );

    const messagesToShow =
      messages.length > 0 ? (
        <Message negative>
          <Message.Header>There was a problem with your request</Message.Header>
          <Message.List>
            {messages.map((message) => (
              <Message.Item>{message}</Message.Item>
            ))}
          </Message.List>
        </Message>
      ) : null;

    const descriptionContent = (
      <Grid.Column>
        <Message info>
          <Message.Header>Reviewer Instructions</Message.Header>
          <p>
            Please review each change in this request carefully. Reviewers can
            selectively apply, modify, cancel individual changes, or reject the
            entire request. Requesters can modify, cancel individual changes, or
            cancel their entire request. This page does not provide a button for
            reviewers to approve all changes in a request because each
            individual change should be carefully reviewed.
          </p>
        </Message>
      </Grid.Column>
    );

    const requestDetails = extendedRequest ? (
      <Table celled definition striped>
        <Table.Body>
          <Table.Row>
            <Table.Cell>User</Table.Cell>
            <Table.Cell>
              <Header size="medium">
                {requesterName}
                {requesterEmail}
                {requesterImage}
              </Header>
            </Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>Request Time</Table.Cell>
            <Table.Cell>
              {new Date(extendedRequest.timestamp).toLocaleString()}
            </Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>Title</Table.Cell>
            <Table.Cell>
              {extendedInfo ? (
                <p>
                  {(extendedInfo.customAttributes &&
                    extendedInfo.customAttributes.title) ||
                    ""}
                </p>
              ) : null}
            </Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>Manager</Table.Cell>
            <Table.Cell>
              {extendedInfo ? (
                <p>
                  {(extendedInfo.customAttributes &&
                    `${extendedInfo.customAttributes.manager} - `) ||
                    ""}
                  {extendedInfo.relations &&
                  extendedInfo.relations.length > 0 &&
                  extendedInfo.relations[0].value ? (
                    <a href={`mailto:${extendedInfo.relations[0].value}`}>
                      {extendedInfo.relations[0].value}
                    </a>
                  ) : null}
                </p>
              ) : null}
            </Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>User Justification</Table.Cell>
            <Table.Cell>{extendedRequest.justification}</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>Status</Table.Cell>
            {extendedRequest.request_status === "approved" ? (
              <Table.Cell positive>{extendedRequest.request_status}</Table.Cell>
            ) : (
              <Table.Cell negative>{extendedRequest.request_status}</Table.Cell>
            )}
          </Table.Row>
          {extendedRequest.arn_url ? (
            <Table.Row>
              <Table.Cell>ARN</Table.Cell>
              <Table.Cell>
                <a
                  href={extendedRequest.arn_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {" "}
                  {extendedRequest.arn}
                </a>
              </Table.Cell>
            </Table.Row>
          ) : null}
          {extendedRequest.reviewer ? (
            <Table.Row>
              <Table.Cell>Reviewer</Table.Cell>
              <Table.Cell>{extendedRequest.reviewer || ""}</Table.Cell>
            </Table.Row>
          ) : null}
          <Table.Row>
            <Table.Cell>Last Updated</Table.Cell>
            <Table.Cell>
              {new Date(lastUpdated * 1000).toLocaleString()}
            </Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>Cross-Account</Table.Cell>
            {extendedRequest.cross_account === true ? (
              <Table.Cell negative>
                <Icon name="attention" /> True
              </Table.Cell>
            ) : (
              <Table.Cell positive>False</Table.Cell>
            )}
          </Table.Row>
        </Table.Body>
      </Table>
    ) : null;

    const commentsContent = extendedRequest.comments ? (
      <CommentsFeedBlockComponent
        comments={extendedRequest.comments}
        reloadDataFromBackend={this.reloadDataFromBackend}
        requestID={requestID}
      />
    ) : null;

    const requestReadOnly =
      extendedRequest.request_status === "rejected" ||
      extendedRequest.request_status === "cancelled";

    const changesContent =
      extendedRequest.changes &&
      extendedRequest.changes.changes &&
      extendedRequest.changes.changes.length > 0 ? (
        <>
          {extendedRequest.changes.changes.map((change) => {
            if (change.change_type === "inline_policy") {
              return (
                <InlinePolicyChangeComponent
                  change={change}
                  config={requestConfig}
                  requestReadOnly={requestReadOnly}
                  updatePolicyDocument={this.updatePolicyDocument}
                  reloadDataFromBackend={this.reloadDataFromBackend}
                  requestID={requestID}
                />
              );
            }
            if (change.change_type === "managed_policy") {
              return (
                <ManagedPolicyChangeComponent
                  change={change}
                  config={requestConfig}
                  requestReadOnly={requestReadOnly}
                  reloadDataFromBackend={this.reloadDataFromBackend}
                  requestID={requestID}
                />
              );
            }
            if (change.change_type === "assume_role_policy") {
              return (
                <AssumeRolePolicyChangeComponent
                  change={change}
                  config={requestConfig}
                  requestReadOnly={requestReadOnly}
                  updatePolicyDocument={this.updatePolicyDocument}
                  reloadDataFromBackend={this.reloadDataFromBackend}
                  requestID={requestID}
                />
              );
            }
            if (change.change_type === "resource_policy") {
              return (
                <ResourcePolicyChangeComponent
                  change={change}
                  config={requestConfig}
                  requestReadOnly={requestReadOnly}
                  updatePolicyDocument={this.updatePolicyDocument}
                  reloadDataFromBackend={this.reloadDataFromBackend}
                  requestID={requestID}
                />
              );
            }
            return null;
          })}
        </>
      ) : null;

    const completeRequestButton = requestConfig.can_approve_reject ? (
      <Grid.Column>
        <Button
          content="Mark Request as Approved"
          positive
          fluid
          onClick={this.updateRequestStatus.bind(this, "approve_request")}
        />
      </Grid.Column>
    ) : null;

    const rejectRequestButton = requestConfig.can_approve_reject ? (
      <Grid.Column>
        <Button
          content="Reject Request"
          negative
          fluid
          onClick={this.updateRequestStatus.bind(this, "reject_request")}
        />
      </Grid.Column>
    ) : null;

    const cancelRequestButton = requestConfig.can_update_cancel ? (
      <Grid.Column>
        <Button
          content="Cancel Request"
          negative
          fluid
          onClick={this.updateRequestStatus.bind(this, "cancel_request")}
        />
      </Grid.Column>
    ) : null;

    // If none of the buttons are visible to user, then user can only view this request
    const userCanViewOnly = !rejectRequestButton && !cancelRequestButton;
    // If user can only view the request, but not modify, don't show any requestButtons
    const requestButtons = userCanViewOnly ? null : (
      <Grid container>
        <Grid.Row columns="equal">
          {/* {completeRequestButton} */}
          {rejectRequestButton}
          {cancelRequestButton}
        </Grid.Row>
      </Grid>
    );

    const requestButtonsContent =
      extendedRequest.request_status === "pending" ? (
        requestButtons
      ) : (
        <Message info fluid>
          <Message.Header>
            This request can no longer be modified
          </Message.Header>
          <p>
            This request can no longer be modified as the status is{" "}
            {extendedRequest.request_status}
          </p>
        </Message>
      );

    const pageContent =
      messagesToShow === null ? (
        <Segment>
          {requestDetails}
          {descriptionContent}
          {changesContent}
          {commentsContent}
          {requestButtonsContent}
        </Segment>
      ) : (
        messagesToShow
      );

    return (
      <>
        <Dimmer active={isSubmitting || loading} inverted>
          <Loader />
        </Dimmer>
        <Header size="huge">Request Review for: {extendedRequest.arn}</Header>
        {pageContent}
      </>
    );
  }
}

export default PolicyRequestReview;