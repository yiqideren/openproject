#-- copyright
# OpenProject is a project management system.
# Copyright (C) 2012-2017 the OpenProject Foundation (OPF)
#
# This program is free software; you can redistribute it and/or
# modify it under the terms of the GNU General Public License version 3.
#
# OpenProject is a fork of ChiliProject, which is a fork of Redmine. The copyright follows:
# Copyright (C) 2006-2017 Jean-Philippe Lang
# Copyright (C) 2010-2013 the ChiliProject Team
#
# This program is free software; you can redistribute it and/or
# modify it under the terms of the GNU General Public License
# as published by the Free Software Foundation; either version 2
# of the License, or (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program; if not, write to the Free Software
# Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
#
# See doc/COPYRIGHT.rdoc for more details.
#++

require 'spec_helper'

describe Query, type: :model do
  let(:query) { FactoryGirl.build(:query) }

  describe '.new_default' do
    it 'set the default sortation' do
      query = Query.new_default

      expect(query.sort_criteria)
        .to match_array([['parent', 'desc']])
    end

    it 'does not use the default sortation if an order is provided' do
      query = Query.new_default(sort_criteria: [['id', 'asc']])

      expect(query.sort_criteria)
        .to match_array([['id', 'asc']])
    end
  end

  describe 'available_columns' do
    context 'with work_package_done_ratio NOT disabled' do
      it 'should include the done_ratio column' do
        expect(query.available_columns.find { |column| column.name == :done_ratio }).to be_truthy
      end
    end

    context 'with work_package_done_ratio disabled' do
      before do
        allow(WorkPackage).to receive(:done_ratio_disabled?).and_return(true)
      end

      it 'should NOT include the done_ratio column' do
        expect(query.available_columns.find { |column| column.name == :done_ratio }).to be_nil
      end
    end

    context 'results caching' do
      let(:project) { FactoryGirl.build_stubbed(:project) }
      let(:project2) { FactoryGirl.build_stubbed(:project) }

      it 'does not call the db twice for the custom fields' do
        query.project = project

        query.available_columns

        expect(project)
          .not_to receive(:all_work_package_custom_fields)

        query.available_columns
      end

      it 'does call the db for the custom fields if the project changes' do
        query.project = project

        query.available_columns

        query.project = project2

        expect(project2)
          .to receive(:all_work_package_custom_fields)
          .and_return []

        query.available_columns
      end

      it 'does call the db for the custom fields if the project changes to nil' do
        query.project = project

        query.available_columns

        query.project = nil

        expect(WorkPackageCustomField)
          .to receive(:all)
          .and_return []

        query.available_columns
      end
    end
  end

  describe '#valid?' do
    it 'should not be valid without a name' do
      query.name = ''
      expect(query.save).to be_falsey
      expect(query.errors[:name].first).to include(I18n.t('activerecord.errors.messages.blank'))
    end

    context 'with a missing value and an operator that requires values' do
      before do
        query.add_filter('due_date', 't-', [''])
      end

      it 'is not valid and creates an error' do
        expect(query.valid?).to be_falsey
        expect(query.errors[:base].first).to include(I18n.t('activerecord.errors.messages.blank'))
      end
    end

    context 'when filters are blank' do
      let(:status) { FactoryGirl.create :status }
      let(:query) { FactoryGirl.build(:query).tap { |q| q.filters = [] } }

      it 'is valid' do
        expect(query.valid?).to be_truthy
      end
    end

    context 'with a missing value for a custom field' do
      let(:custom_field) do
        FactoryGirl.create :text_issue_custom_field, is_filter: true, is_for_all: true
      end

      before do
        query.add_filter('cf_' + custom_field.id.to_s, '=', [''])
      end

      it 'should have the name of the custom field in the error message' do
        expect(query).to_not be_valid
        expect(query.errors.messages[:base].to_s).to include(custom_field.name)
      end
    end

    context 'with a filter for a non existing custom field' do
      before do
        query.add_filter('cf_0', '=', ['1'])
      end

      it 'is not valid' do
        expect(query.valid?).to be_falsey
      end
    end
  end

  describe '#filter_for' do
    context 'for a status_id filter' do
      before do
        allow(Status)
          .to receive(:exists?)
          .and_return(true)
      end

      subject { query.filter_for('status_id') }

      it 'exists' do
        is_expected.to_not be_nil
      end

      it 'has the context set' do
        expect(subject.context).to eql query.project

        query.project = nil

        expect(query.filter_for('status_id').context).to be_nil
      end

      it 'reuses an existing filter' do
        expect(subject.object_id).to eql query.filter_for('status_id').object_id
      end
    end
  end

  describe 'filters after deserialization' do
    it 'sets the context (project) on deserialization' do
      query.save!

      query.reload
      query.filters.each do |filter|
        expect(filter.context).to eql(query.project)
      end
    end
  end
end
